import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ---------------- TYPES ---------------- */

type PaymentStatus = "PAID" | "PENDING" | "FAILED";

interface Payment {
  id: string;
  guestName: string;
  method: "ESEWA" | "KHALTI" | "CASH";
  amount: number;
  status: PaymentStatus;
  date: string;
}

interface PaymentResponse {
  payments: Payment[];
}

/* ---------------- MOCK ---------------- */

const mockData: PaymentResponse = {
  payments: [
    {
      id: "1",
      guestName: "John Doe",
      method: "ESEWA",
      amount: 200,
      status: "PAID",
      date: "2026-04-20",
    },
    {
      id: "2",
      guestName: "Alice",
      method: "KHALTI",
      amount: 120,
      status: "PENDING",
      date: "2026-04-19",
    },
  ],
};

/* ---------------- COMPONENT ---------------- */

const Payments = () => {
  const [data, setData] = useState<PaymentResponse | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      // const res = await fetch("/api/dashboard/payments");
      // const json = await res.json();
      // setData(json.data);

      setData(mockData);
    };

    fetchPayments();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="p-4">Guest</th>
            <th className="p-4">Method</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Date</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>

        <tbody>
          {data.payments.map((p) => (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t hover:bg-gray-50"
            >
              <td className="p-4">{p.guestName}</td>
              <td className="p-4">{p.method}</td>
              <td className="p-4 font-medium">${p.amount}</td>
              <td className="p-4 text-gray-600">{p.date}</td>

              <td className="p-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    p.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : p.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {p.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>

      </table>
    </div>
  );
};

export default Payments;