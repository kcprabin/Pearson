import React, { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../Contexts/Authcontext';
import { api } from '../services/api';
import type {
  Order,
  Feedback,
  MenuItem,
  KnowledgeDocument,
  WhatsAppStatus,
  DashboardMetrics,
  OrderStatus,
} from '../types/dashboard';

import { Sidebar, type DashboardView } from '../Components/Sidebar';
import { Topbar } from '../Components/Topbar';
import { OverviewTab } from '../Components/OverviewTab';
import { OrdersTab } from '../Components/OrdersTab';
import { FeedbackTab } from '../Components/FeedbackTab';
import { WhatsAppTab } from '../Components/WhatsAppTab';
import { KnowledgeTab } from '../Components/KnowledgeTab';
import { AssistantTab } from '../Components/AssistantTab';
import { SettingsTab } from '../Components/SettingsTab';
import { CreateOrderModal } from '../Components/CreateOrderModal';
import { FeedbackModal } from '../Components/FeedbackModal';

const Dashboard: React.FC = () => {
  const auth = useAuth();
  const restaurantName = auth?.user?.name || auth?.user?.Name || 'Sunrise Bistro & Lounge';
  const restaurantId = auth?.user?.restaurantId || auth?.user?.id || 1;
  const threadId = auth?.user?.threadId || auth?.user?.hotelId || 'demo-thread-pearson-01';

  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus>({
    receiverConnected: true,
    botConnected: true,
  });

  // Modals
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Initial data loading
  const loadInitialData = useCallback(async () => {
    try {
      const [fetchedOrders, fetchedFeedback, fetchedWhatsApp] = await Promise.all([
        api.getOrders(restaurantId),
        api.getFeedback(restaurantId),
        api.getWhatsAppStatus(),
      ]);
      setOrders(fetchedOrders);
      setFeedback(fetchedFeedback);
      setWhatsAppStatus(fetchedWhatsApp);
      setMenuItems(api.getMenuItems());
      setDocuments(api.getDocuments());
    } catch (e) {
      console.log('Error initializing dashboard data:', e);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Derived Metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => (o.orderStatus !== 'cancelled' ? sum + o.price : sum), 0);
    const active = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'in_progress').length;
    const completed = orders.filter((o) => o.orderStatus === 'completed').length;

    let avgRating = 5.0;
    let positiveCount = 0;
    if (feedback.length > 0) {
      const sumRatings = feedback.reduce((sum, f) => sum + f.rating, 0);
      avgRating = sumRatings / feedback.length;
      positiveCount = feedback.filter((f) => f.rating >= 4).length;
    }

    return {
      totalRevenue: totalRev,
      revenueChange: 14.8,
      activeOrders: active,
      completedOrders: completed,
      totalOrders: orders.length,
      ordersChange: 18,
      averageRating: avgRating,
      totalReviews: feedback.length,
      positiveRatingRate: feedback.length > 0 ? Math.round((positiveCount / feedback.length) * 100) : 100,
      whatsAppActive: whatsAppStatus.receiverConnected,
    };
  }, [orders, feedback, whatsAppStatus]);

  // Handlers
  const handleUpdateOrderStatus = async (orderId: number | string, status: OrderStatus) => {
    await api.updateOrderStatus(orderId, status);
    setOrders((prev) =>
      prev.map((o) => (String(o.id) === String(orderId) ? { ...o, orderStatus: status } : o)),
    );
  };

  const handleCreateOrder = async (orderData: { username: string; items: string[]; price: number }) => {
    const created = await api.createOrder(restaurantId, {
      ...orderData,
      restaurantName,
    });
    setOrders((prev) => [created, ...prev]);
  };

  const handleSubmitFeedback = async (item: {
    username: string;
    feedbackText: string;
    rating: number;
    category?: string;
  }) => {
    const created = await api.submitFeedback(restaurantId, {
      ...item,
      restaurantName,
    });
    setFeedback((prev) => [created, ...prev]);
  };

  const handleReplyToFeedback = async (feedbackId: number | string, replyText: string) => {
    await api.replyToFeedback(feedbackId, replyText);
    setFeedback((prev) =>
      prev.map((f) => (String(f.id) === String(feedbackId) ? { ...f, reply: replyText } : f)),
    );
  };

  const handleExportExecutiveReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${restaurantName} - Executive Summary`, 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);
    doc.text(
      `Total Revenue: $${metrics.totalRevenue} | Active Orders: ${metrics.activeOrders} | CSAT Rating: ${metrics.averageRating.toFixed(1)} / 5.0 (${metrics.totalReviews} reviews)`,
      14,
      34,
    );

    const ordersTableData = orders.slice(0, 10).map((o) => [
      `#${o.id}`,
      o.username,
      o.items.join(', '),
      `$${o.price}`,
      o.orderStatus.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Order ID', 'Customer', 'Items', 'Total', 'Status']],
      body: ordersTableData,
      theme: 'grid',
      headStyles: { fillColor: [17, 59, 58] },
    });

    doc.save(`${restaurantName.replace(/\s+/g, '_')}_Executive_Report.pdf`);
  };

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        pendingOrdersCount={pendingOrdersCount}
        totalFeedbackCount={feedback.length}
      />

      {/* Main Content Area */}
      <div className="main-content flex-1 min-w-0">
        <Topbar
          currentView={currentView}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenNewOrder={() => setOrderModalOpen(true)}
          onOpenFeedbackModal={() => setFeedbackModalOpen(true)}
          onExportReport={handleExportExecutiveReport}
          whatsAppConnected={whatsAppStatus.receiverConnected}
        />

        <main className="page-content">
          {currentView === 'overview' && (
            <OverviewTab
              metrics={metrics}
              orders={orders}
              feedback={feedback}
              onSelectView={setCurrentView}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onOpenFeedbackModal={() => setFeedbackModalOpen(true)}
              restaurantName={restaurantName}
            />
          )}

          {currentView === 'orders' && (
            <OrdersTab
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onOpenCreateOrder={() => setOrderModalOpen(true)}
              restaurantName={restaurantName}
            />
          )}

          {currentView === 'feedback' && (
            <FeedbackTab
              feedback={feedback}
              onSubmitFeedback={handleSubmitFeedback}
              onReplyToFeedback={handleReplyToFeedback}
              restaurantName={restaurantName}
              restaurantId={restaurantId}
            />
          )}

          {currentView === 'whatsapp' && (
            <WhatsAppTab
              status={whatsAppStatus}
              onRefreshStatus={async () => {
                const s = await api.getWhatsAppStatus();
                setWhatsAppStatus(s);
              }}
              onPairPhone={(phone) => api.pairWhatsApp(phone)}
              onSendMessage={(phone, msg) => api.sendWhatsAppMessage(phone, msg)}
              restaurantPhone={auth?.user?.phoneNumber}
            />
          )}

          {currentView === 'knowledge' && (
            <KnowledgeTab
              documents={documents}
              menuItems={menuItems}
              onAddDocument={(doc) => {
                const next = [doc, ...documents];
                setDocuments(next);
                api.saveDocuments(next);
              }}
              onDeleteDocument={(id) => {
                const next = documents.filter((d) => d.id !== id);
                setDocuments(next);
                api.saveDocuments(next);
              }}
              onAddMenuItem={(item) => {
                const next = [item, ...menuItems];
                setMenuItems(next);
                api.saveMenuItems(next);
              }}
              onDeleteMenuItem={(id) => {
                const next = menuItems.filter((m) => m.id !== id);
                setMenuItems(next);
                api.saveMenuItems(next);
              }}
            />
          )}

          {currentView === 'assistant' && (
            <AssistantTab
              onSendMessage={(msg) => api.sendAssistantMessage(threadId, msg)}
              restaurantName={restaurantName}
            />
          )}

          {currentView === 'settings' && (
            <SettingsTab
              onUpdateRestaurant={(data) => api.updateRestaurant(threadId, data)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSubmit={handleCreateOrder}
        menuItems={menuItems}
      />

      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleSubmitFeedback}
        restaurantName={restaurantName}
      />
    </div>
  );
};

export default Dashboard;
