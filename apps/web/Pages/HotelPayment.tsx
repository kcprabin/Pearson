import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const HotelPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateHotel = (location.state as any)?.hotelData;
  const [hotelData] = useState<any>(stateHotel || JSON.parse(localStorage.getItem('pendingHotel') || 'null'));

  useEffect(() => {
    if (!hotelData) {
      // nothing to pay for
    }
  }, []);

  const handlePay = () => {
    // Mock payment flow
    setTimeout(() => {
      // After payment, we would send request to admin. For now just show confirmation.
      localStorage.removeItem('pendingHotel');
      navigate('/login');
      alert('Payment successful. Your hotel registration request has been recorded.');
    }, 800);
  };

  if (!hotelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 bg-white rounded shadow">No hotel data found. Please register hotel first.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Confirm & Pay</h2>
        <div className="mb-4">
          <p><strong>Hotel:</strong> {hotelData.hotelName || '—'}</p>
          <p><strong>Location:</strong> {hotelData.location || '—'}</p>
          <p><strong>Type:</strong> {hotelData.propertyType || '—'}</p>
          <p><strong>Phone:</strong> {hotelData.phone || '—'}</p>
        </div>
        <div className="mb-4">
          <p>Amount: <strong>$9.99</strong> (mock)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePay} className="py-2 px-4 bg-black text-white rounded">Pay Now</button>
          <button onClick={() => navigate('/')} className="py-2 px-4 border rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default HotelPayment;
