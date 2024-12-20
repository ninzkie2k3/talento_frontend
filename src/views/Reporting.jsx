import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import axiosClient from "../axiosClient";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

dayjs.extend(utc);
dayjs.extend(timezone);

const timezoneName = "Asia/Manila";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Reporting() {
  const { isSidebarOpen } = useOutletContext();
  const [summary, setSummary] = useState({
    total_users: [],
    users_created_today: [],
    total_bookings: [],
    bookings_today: [],
    cancelled_bookings: [],
    approved_bookings: [],
    sales: 0, // Add sales field
  });

  const [loading, setLoading] = useState(true);
  const reportRef = useRef(); // Reference to the container for PDF capture

  useEffect(() => {
    axiosClient
      .get("/admin/summary-report")
      .then((response) => {
        if (response.data.status === "success") {
          setSummary(response.data.data);
        }
      })
      .catch((error) => console.error("Error fetching summary data:", error))
      .finally(() => setLoading(false));
  }, []);

  const labels = Array.from({ length: 30 }, (_, i) => {
    return dayjs()
      .tz(timezoneName)
      .subtract(29 - i, "day")
      .format("MMM D");
  });

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        offset: false,
      },
      y: {
        beginAtZero: true,
        grace: "10%",
      },
    },
  };

  const generateChartData = (label, data, backgroundColor) => ({
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor,
      },
    ],
  });

  const downloadPDF = async () => {
    const reportElement = reportRef.current;

    if (!reportElement) return;

    const canvas = await html2canvas(reportElement, {
      scale: 2, // Increase the scale for better resolution
    });
    const image = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(image, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("Report.pdf");
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading data...</div>;
  }

  if (!summary) {
    return (
      <div className="text-center text-red-600">
        Error loading data. Please try again.
      </div>
    );
  }

  // Generate chart data for graphs
  const totalUsersData = generateChartData(
    "Total Users",
    summary.total_users,
    "rgba(54, 162, 235, 0.6)"
  );

  const usersCreatedTodayData = generateChartData(
    "Users Created Today",
    summary.users_created_today,
    "rgba(255, 99, 132, 0.6)"
  );

  const totalBookingsData = generateChartData(
    "Total Bookings",
    summary.total_bookings,
    "rgba(75, 192, 192, 0.6)"
  );

  const bookingsTodayData = generateChartData(
    "Bookings Created Today",
    summary.bookings_today,
    "rgba(255, 206, 86, 0.6)"
  );

  const cancelledBookingsData = generateChartData(
    "Cancelled Bookings",
    summary.cancelled_bookings,
    "rgba(255, 159, 64, 0.6)"
  );

  const approvedBookingsData = generateChartData(
    "Approved Bookings",
    summary.approved_bookings,
    "rgba(153, 102, 255, 0.6)"
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <button
        onClick={downloadPDF}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      >
        Download PDF
      </button>

      <main ref={reportRef} className="flex-1 w-full bg-white p-6 rounded shadow">
        <div className="px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Metrics Summary Cards */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Total Users</h2>
            <p className="text-gray-600 text-4xl">
              {summary.total_users[summary.total_users.length - 1] || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Users Created Today
            </h2>
            <p className="text-gray-600 text-4xl">
              {summary.users_created_today[summary.users_created_today.length - 1] || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Total Bookings</h2>
            <p className="text-gray-600 text-4xl">
              {summary.total_bookings[summary.total_bookings.length - 1] || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Bookings Created Today
            </h2>
            <p className="text-gray-600 text-4xl">
              {summary.bookings_today[summary.bookings_today.length - 1] || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Cancelled Bookings
            </h2>
            <p className="text-gray-600 text-4xl">
              {summary.cancelled_bookings[summary.cancelled_bookings.length - 1] || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Approved Bookings
            </h2>
            <p className="text-gray-600 text-4xl">
              {summary.approved_bookings[summary.approved_bookings.length - 1] || 0}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Sales</h2>
            <p className="text-gray-600 text-4xl">₱{summary.sales || 0}</p>
          </div>

          {/* Graphs */}
          <div className="bg-white shadow rounded-lg p-6 h-96">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Total Users Trend (Last 30 Days)
            </h2>
            <Bar data={totalUsersData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Users Created Today Trend (Last 30 Days)
            </h2>
            <Bar data={usersCreatedTodayData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Total Bookings Trend (Last 30 Days)
            </h2>
            <Bar data={totalBookingsData} options={chartOptions} />
          </div>
        </div>
      </main>
    </div>
  );
}
