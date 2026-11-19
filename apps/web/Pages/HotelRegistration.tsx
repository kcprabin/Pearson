
import { useNavigate } from "react-router-dom";

const HotelRegistration = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Register Your Hotel (Quick)</h2>
        <p className="text-sm text-gray-600 text-center mb-4">This quick flow collects basic hotel data then proceeds to payment.</p>
        <form onSubmit={(e) => { e.preventDefault(); navigate('/hotel-payment'); }} className="grid grid-cols-1 gap-4">
          <input name="hotelName" placeholder="Hotel name" className="px-4 py-2 border rounded" />
          <input name="location" placeholder="Location / City" className="px-4 py-2 border rounded" />
          <input name="propertyType" placeholder="Property type (Hotel, Resort...)" className="px-4 py-2 border rounded" />
          <input name="phone" placeholder="Contact phone" className="px-4 py-2 border rounded" />
          <textarea name="description" placeholder="Short description" className="px-4 py-2 border rounded" />
          <div className="flex gap-2">
            <button type="submit" className="py-2 px-4 bg-black text-white rounded">Proceed to Payment</button>
            <button type="button" onClick={() => navigate('/')} className="py-2 px-4 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelRegistration;
