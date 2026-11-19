import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "../Contexts/Authcontext";
import { getHotelById } from "../Services/hotel.api";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BedDouble,
  Star,
  MessageSquare,
  CreditCard,
  BarChart2,
  Settings,
} from "lucide-react";


interface SidebarProps {
  collapsed: boolean;
}

const sections = [
  {
    title: "MAIN",
    items: [
      { name: "Overview",  path: "/dashboard/overview",  icon: LayoutDashboard },
      { name: "Bookings",  path: "/dashboard/bookings",  icon: CalendarCheck   },
      { name: "Guests",    path: "/dashboard/guests",    icon: Users           },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { name: "Rooms",    path: "/dashboard/rooms",    icon: BedDouble    },
      { name: "Reviews",  path: "/dashboard/reviews",  icon: Star         },
      { name: "Messages", path: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { name: "Finance",  path: "/dashboard/finance",  icon: CreditCard },
      { name: "Reports",  path: "/dashboard/reports",  icon: BarChart2  },
      { name: "Settings", path: "/dashboard/settings", icon: Settings   },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
    const [hotel,setHotel]=useState<any>();
    const auth=useAuth();
    const hotelId=auth?.hotelId;
    useEffect(()=>{

      const fetchHotel=async()=>{
        if(!hotelId){
          console.log("no hotel id found");
          return;
        }
       const res= await getHotelById(hotelId);
       setHotel(res?.data??res)
      }
     fetchHotel();

    },[hotelId])

   return (
    <aside
      className={`
        h-screen bg-white border-r border-slate-200
        transition-all duration-300
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <img
              src="/logo-short.png"
              alt="Travallee logo"
              className="h-12 w-12 object-cover rounded-2xl"
            />
            <div>
              <span className="text-lg font-semibold text-blue-600">
                Travallee
              </span>
              <div className="text-[10px] text-slate-800 tracking-widest">
                {hotel?.hotelName || "hotelName"}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-md  overflow-hidden">
            <img
              src="/logo-short.png"
              alt="Travallee logo"
              className="h-12 w-12 object-cover rounded-2xl"
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="px-2 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="text-[11px] text-slate-400 px-3 mb-2 tracking-widest font-medium">
                {section.title}
              </div>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="relative flex items-center gap-3 px-3 py-2 rounded-md text-sm"
                    title={collapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="bar"
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-blue-500 rounded"
                          />
                        )}

                        <Icon
                          size={17}
                          className={`
                            shrink-0 transition-colors
                            ${isActive ? "text-blue-600" : "text-slate-400"}
                          `}
                        />

                        {!collapsed && (
                          <motion.span
                            className={`
                              transition-colors
                              ${isActive
                                ? "text-blue-600 font-medium"
                                : "text-slate-600 hover:text-slate-900"}
                            `}
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
   )
};

export default Sidebar;