import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Paper,
  Modal,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle
} from '@mui/material';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import axiosClient from "../axiosClient";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import jsPDF from "jspdf";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import DownloadIcon from '@mui/icons-material/Download';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

dayjs.extend(utc);
dayjs.extend(timezone);

const timezoneName = "Asia/Manila";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Reporting() {
  const { isSidebarOpen } = useOutletContext();
  const [summary, setSummary] = useState({
    total_bookings: 0,
    bookings_today: 0,
    cancelled_bookings: 0,
    approved_bookings: 0,
    sales: 0,
    monthly_statistics: [],
    monthly_revenue: [],
    talent_statistics: {
      by_month: {},
      total_by_talent: {}
    },
    weekly_statistics: [],
    yearly_statistics: [],
  });
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(); // Reference to the container for PDF capture

  const [openModal, setOpenModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailsData, setDetailsData] = useState([]);

  const handleCardClick = async (cardType) => {
    try {
      let response;
      switch (cardType) {
        case 'total_bookings':
          response = await axiosClient.get('/admin/booking-details');
          break;
        case 'bookings_today':
          response = await axiosClient.get('/admin/today-bookings');
          break;
        case 'cancelled_bookings':
          response = await axiosClient.get('/admin/cancelled-bookings');
          break;
        case 'approved_bookings':
          response = await axiosClient.get('/admin/approved-bookings');
          break;
        case 'sales':
          response = await axiosClient.get('/admin/transaction-details');
          break;
        default:
          return;
      }

      if (response.data.status === 'success') {
        setDetailsData(response.data.data);
        setSelectedCard(cardType);
        setOpenModal(true);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to fetch details');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/admin/summary-report');
        if (response.data.status === 'success') {
          setSummary(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const handleDownloadAllDetails = async () => {
    try {
      const doc = new jsPDF('landscape');
      const endpoints = [
        { url: '/admin/booking-details', title: 'All Bookings' },
        { url: '/admin/today-bookings', title: 'Today\'s Bookings' },
        { url: '/admin/cancelled-bookings', title: 'Cancelled Bookings' },
        { url: '/admin/approved-bookings', title: 'Approved Bookings' },
        { url: '/admin/transaction-details', title: 'Transaction Details' }
      ];
  
      let yOffset = 15;
  
      for (const [index, endpoint] of endpoints.entries()) {
        if (index > 0) {
          doc.addPage();
          yOffset = 15;
        }
  
        const response = await axiosClient.get(endpoint.url);
        if (response.data.status === 'success') {
          // Add section title
          doc.setFontSize(16);
          doc.text(endpoint.title, 14, yOffset);
  
          // Format table data based on endpoint
          let columns, data;
          
          switch (endpoint.url) {
            case '/admin/booking-details':
              columns = ['Event Name', 'Client', 'Date', 'Status', 'Amount', 'Performers'];
              data = response.data.data.map(item => [
                item.event_name,
                item.client_name,
                item.start_date,
                item.status,
                `${item.total_amount} TCoins`,
                item.performers
              ]);
              break;
  
            case '/admin/today-bookings':
              columns = ['Event Name', 'Client', 'start time','end time', 'Status', 'Amount', 'Performers'];
              data = response.data.data.map(item => [
                item.event_name,
                item.client_name,
                item.start_time,
                item.end_time,
                item.status,
                `${item.total_amount} TCoins`,
                item.performers
              ]);
              break;
  
            case '/admin/cancelled-bookings':
              columns = ['Event Name', 'Client', 'Cancelled Date', 'Amount', 'Performers'];
              data = response.data.data.map(item => [
                item.event_name,
                item.client_name,
                item.cancelled_date,
                `${item.total_amount} TCoins`,
                item.performers
              ]);
              break;
  
            case '/admin/approved-bookings':
              columns = ['Event Name', 'Client', 'Approved Date', 'Amount', 'Performers'];
              data = response.data.data.map(item => [
                item.event_name,
                item.client_name,
                item.approved_date,
                `${item.total_amount} TCoins`,
                item.performers
              ]);
              break;
  
            case '/admin/transaction-details':
              columns = ['Transaction ID','Booking ID', 'Event','Theme', 'Client','Performer', 'Date', 'Amount', 'Status'];
              data = response.data.data.map(item => [
                item.transaction_id,
                item.booking_id,
                item.event_name,
                item.theme_name,
                item.user,
                item.performer,
                item.date,
                `${item.amount} TCoins`,
              
                item.status
              ]);
              break;
          }
  
          // Add table to PDF
          doc.autoTable({
            head: [columns],
            body: data,
            startY: yOffset + 10,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { 
              fillColor: [41, 128, 185],
              textColor: 255
            },
            alternateRowStyles: { 
              fillColor: [245, 245, 245]
            }
          });
        }
      }
  
      doc.save('detailed_booking_reports.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleDownloadModalData = () => {
    try {
      const doc = new jsPDF('landscape');
      
      const title = {
        'total_bookings': 'All Bookings Report',
        'bookings_today': "Today's Bookings Report",
        'cancelled_bookings': 'Cancelled Bookings Report',
        'approved_bookings': 'Approved Bookings Report',
        'sales': 'Transaction Details Report'
      }[selectedCard];
  
      doc.setFontSize(16);
      doc.text(title, 14, 15);
  
      const columns = {
        'total_bookings': ['Event Name', 'Client', 'Date', 'Status', 'Amount', 'Performers'],
        'bookings_today': ['Event Name', 'Client', 'Time', 'Status', 'Amount', 'Performers'],
        'cancelled_bookings': ['Event Name', 'Client', 'Cancelled Date', 'Amount', 'Performers'],
        'approved_bookings': ['Event Name', 'Client', 'Approved Date', 'Amount', 'Performers'],
        'sales': ['Transaction ID', 'Event', 'Client', 'Date', 'Amount', 'Type', 'Status']
      }[selectedCard];
  
      const data = detailsData.map(item => {
        switch(selectedCard) {
          case 'total_bookings':
            return [
              item.event_name,
              item.client_name,
              item.start_date,
              item.status,
              `${item.total_amount} TCoins`,
              item.performers
            ];
          case 'bookings_today':
            return [
              item.event_name,
              item.client_name,
              item.created_at,
              item.status,
              `${item.total_amount} TCoins`,
              item.performers
            ];
          case 'cancelled_bookings':
            return [
              item.event_name,
              item.client_name,
              item.cancelled_date,
              `${item.total_amount} TCoins`,
              item.performers
            ];
          case 'approved_bookings':
            return [
              item.event_name,
              item.client_name,
              item.approved_date,
              `${item.total_amount} TCoins`,
              item.performers
            ];
          case 'sales':
            return [
              item.transaction_id,
              item.event_name,
              item.client_name,
              item.date,
              `${item.amount} TCoins`,
              item.type,
              item.status
            ];
          default:
            return [];
        }
      });
  
      doc.autoTable({
        head: [columns],
        body: data,
        startY: 25,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255
        },
        alternateRowStyles: { 
          fillColor: [245, 245, 245]
        }
      });
  
      doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return <CircularProgress className="m-auto" />;
  }

  const summaryCards = [
    { title: 'Total Bookings', value: summary?.total_bookings || 0, color: 'bg-blue-100' },
    { title: "Today's Bookings", value: summary?.bookings_today || 0, color: 'bg-green-100' },
    { title: 'Cancelled Bookings', value: summary?.cancelled_bookings || 0, color: 'bg-red-100' },
    { title: 'Approved Bookings', value: summary?.approved_bookings || 0, color: 'bg-yellow-100' },
    { title: 'Total Sales (TCoins)', value: summary?.sales || 0, color: 'bg-purple-100' }
  ];

  const chartData = {
    monthlyBookings: {
      labels: summary.monthly_statistics?.map(stat => stat.month) || [],
      datasets: [{
        label: 'Monthly Bookings',
        data: summary.monthly_statistics?.map(stat => stat.total_bookings) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    monthlyRevenue: {
      labels: summary.monthly_revenue?.map(rev => rev.month) || [],
      datasets: [{
        label: 'Monthly Revenue',
        data: summary.monthly_revenue?.map(rev => rev.revenue) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
      }]
    },
    talentCategory: {
      labels: Object.keys(summary.talent_statistics?.total_by_talent || {}),
      datasets: [{
        data: Object.values(summary.talent_statistics?.total_by_talent || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
      }]
    },
    weeklyBookings: {
      labels: summary.weekly_statistics?.map(stat => stat.week) || [],
      datasets: [{
        label: 'Weekly Bookings',
        data: summary.weekly_statistics?.map(stat => stat.total_bookings) || [],
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1
      }]
    },
    yearlyBookings: {
      labels: summary.yearly_statistics?.map(stat => stat.year) || [],
      datasets: [{
        label: 'Yearly Bookings',
        data: summary.yearly_statistics?.map(stat => stat.total_bookings) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      }]
    }
  };

  const DetailsModal = () => (
    <Dialog 
      open={openModal} 
      onClose={() => setOpenModal(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle className="flex justify-between items-center">
        <Typography variant="h6">
          {selectedCard === 'total_bookings' && 'All Bookings'}
          {selectedCard === 'bookings_today' && "Today's Bookings"}
          {selectedCard === 'cancelled_bookings' && 'Cancelled Bookings'}
          {selectedCard === 'approved_bookings' && 'Approved Bookings'}
          {selectedCard === 'sales' && 'Transaction Details'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadModalData}
        >
          Download PDF
        </Button>
      </DialogTitle>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                 width: '80%', bgcolor: 'background.paper', boxShadow: 24, p: 4, maxHeight: '80vh', overflow: 'auto' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {selectedCard === 'total_bookings' && (
                  <>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Theme Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Performers</TableCell>
                  </>
                )}
                {selectedCard === 'bookings_today' && (
                  <>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Theme Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Start time</TableCell>
                    <TableCell>End time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Performers</TableCell>
                  </>
                )}
                {selectedCard === 'cancelled_bookings' && (
                  <>
                     <TableCell>Event Name</TableCell>
                     <TableCell>Theme Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Cancelled Date</TableCell>
                   
                    <TableCell>Amount</TableCell>
                    <TableCell>Performers</TableCell>
                  </>
                )}
                {selectedCard === 'approved_bookings' && (
                  <>
                     <TableCell>Event Name</TableCell>
                     <TableCell>Theme Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Approved Date</TableCell>
                   
                    <TableCell>Amount</TableCell>
                    <TableCell>Performers</TableCell>
                  </>
                )}
                {selectedCard === 'sales' && (
                  <>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {detailsData.map((item, index) => (
                <TableRow key={index}>
                  {selectedCard === 'total_bookings' && (
                    <>
                      <TableCell>{item.event_name}</TableCell>
                      <TableCell>{item.theme_name}</TableCell>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell>{item.start_date}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.total_amount}</TableCell>
                      <TableCell>{item.performers}</TableCell>
                    </>
                  )}
                  {selectedCard === 'bookings_today' && (
                    <>
                      <TableCell>{item.event_name}</TableCell>
                      <TableCell>{item.theme_name}</TableCell>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell>{item.created_at}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>{item.total_amount} TCoins</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.performer_details.map((performer, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span>{performer.name}</span>
                              <span className="ml-2 font-medium">{performer.amount} TCoins</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </>
                  )}
                  {selectedCard === 'cancelled_bookings' && (
                    <>
                      <TableCell>{item.event_name}</TableCell>
                      <TableCell>{item.theme_name}</TableCell>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell>{item.cancelled_date}</TableCell>
                      <TableCell>{item.total_amount}</TableCell>
                      <TableCell>{item.performers}</TableCell>
                    </>
                  )}
                  {selectedCard === 'approved_bookings' && (
                    <>
                      <TableCell>{item.event_name}</TableCell>
                      <TableCell>{item.theme_name}</TableCell>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell>{item.approved_date}</TableCell>
                      <TableCell>{item.total_amount}</TableCell>
                      <TableCell>{item.performers}</TableCell>
                    </>
                  )}
                  {selectedCard === 'sales' && (
                    <>
                      <TableCell>{item.transaction_id}</TableCell>
                      <TableCell>{item.event_name}</TableCell>
                      <TableCell>{item.client_name}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.amount} TCoins</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Dialog>
  );

  // Add chart options
  const monthlyChartOptions = {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Monthly Statistics'
    },
    xAxis: {
      categories: summary.monthly_statistics?.map(stat => stat.month) || []
    },
    yAxis: {
      title: {
        text: 'Count'
      }
    },
    series: [{
      name: 'Total Bookings',
      data: summary.monthly_statistics?.map(stat => stat.total_bookings) || []
    }, {
      name: 'Cancelled',
      data: summary.monthly_statistics?.map(stat => stat.cancelled_bookings) || []
    }, {
      name: 'Accepted',
      data: summary.monthly_statistics?.map(stat => stat.accepted_bookings) || []
    }]
  };

  const revenueChartOptions = {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Monthly Revenue'
    },
    xAxis: {
      categories: summary.monthly_revenue?.map(rev => rev.month) || []
    },
    yAxis: {
      title: {
        text: 'Revenue (TCoins)'
      }
    },
    series: [{
      name: 'Revenue',
      data: summary.monthly_revenue?.map(rev => rev.revenue) || []
    }]
  };

  const weeklyChartOptions = {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Weekly Statistics'
    },
    xAxis: {
      categories: summary.weekly_statistics?.map(stat => `Week ${stat.week}`) || []
    },
    yAxis: {
      title: {
        text: 'Count'
      }
    },
    series: [{
      name: 'Total Bookings',
      data: summary.weekly_statistics?.map(stat => stat.total_bookings) || []
    }, {
      name: 'Cancelled',
      data: summary.weekly_statistics?.map(stat => stat.cancelled_bookings) || []
    }, {
      name: 'Accepted',
      data: summary.weekly_statistics?.map(stat => stat.accepted_bookings) || []
    }]
  };

  const yearlyChartOptions = {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Yearly Statistics'
    },
    xAxis: {
      categories: summary.yearly_statistics?.map(stat => stat.year.toString()) || []
    },
    yAxis: {
      title: {
        text: 'Count'
      }
    },
    series: [{
      name: 'Total Bookings',
      data: summary.yearly_statistics?.map(stat => stat.total_bookings) || []
    }, {
      name: 'Cancelled',
      data: summary.yearly_statistics?.map(stat => stat.cancelled_bookings) || []
    }, {
      name: 'Accepted',
      data: summary.yearly_statistics?.map(stat => stat.accepted_bookings) || []
    }]
  };

  const advancedRevenueOptions = {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Revenue Statistics'
    },
    xAxis: {
      categories: summary.yearly_revenue?.map(rev => rev.year.toString()) || []
    },
    yAxis: {
      title: {
        text: 'Revenue (TCoins)'
      }
    },
    series: [{
      name: 'Yearly Revenue',
      data: summary.yearly_revenue?.map(rev => parseFloat(rev.total_revenue)) || []
    }, {
      name: 'Weekly Revenue',
      data: summary.weekly_revenue?.map(rev => parseFloat(rev.total_revenue)) || []
    }]
  };

  const weeklyTalentOptions = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Bookings by Talent (Weekly)'
    },
    series: [{
      name: 'Bookings',
      data: Object.entries(summary.talent_statistics?.by_week || {}).map(([name, data]) => ({
        name: name,
        y: data.total_bookings
      }))
    }]
  };

  const monthlyRevenueOptions = {
    chart: {
      type: 'line'
    },
    title: {
      text: 'Monthly Revenue'
    },
    xAxis: {
      categories: summary.monthly_revenue?.map(rev => rev.month) || []
    },
    yAxis: {
      title: {
        text: 'Revenue (TCoins)'
      }
    },
    series: [{
      name: 'Revenue',
      data: summary.monthly_revenue?.map(rev => parseFloat(rev.revenue)) || []
    }]
  };

  const talentWeeklyChartOptions = {
    chart: {
      type: 'column'
    },
    title: {
      text: 'Bookings By Talent (Weekly)'
    },
    xAxis: {
      categories: ['Week ' + summary.weekly_statistics?.[0]?.week] || []
    },
    yAxis: {
      title: {
        text: 'Number of Bookings'
      }
    },
    series: Object.entries(summary.talent_statistics?.by_week || {}).map(([name, data]) => ({
      name: name,
      data: data.weekly_bookings
    }))
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleDownloadAllDetails}
        startIcon={<DownloadIcon />}
        className="mb-4"
      >
        Download Details
      </Button>

      <main ref={reportRef} className="flex-1 w-full bg-white p-6 rounded shadow">
        <Typography variant="h4" className="mb-6">Summary Report</Typography>

        <Grid container spacing={3} className="mb-6">
          {summaryCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
              <Card className={`${card.color} hover:shadow-lg transition-shadow`} onClick={() => handleCardClick(card.title.toLowerCase().replace(/ /g, '_'))}>
                <CardContent>
                  <Typography variant="h6" className="font-bold mb-2">{card.title}</Typography>
                  <Typography variant="h4">{card.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4} className="mb-6">
          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">Weekly Booking Trends</Typography>
              <Line data={chartData.weeklyBookings} options={{ responsive: true }} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">Monthly Bookings</Typography>
              <Line data={chartData.monthlyBookings} options={{ responsive: true }} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4} className="mb-6">
          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">Yearly Booking Comparison</Typography>
              <Bar data={chartData.yearlyBookings} options={{ responsive: true }} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <Typography variant="h6" className="mb-4">Monthly Revenue</Typography>
              <Bar data={chartData.monthlyRevenue} options={{ responsive: true }} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4} className="mt-6">
          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={monthlyChartOptions}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={advancedRevenueOptions}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={weeklyChartOptions}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={yearlyChartOptions}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={revenueChartOptions}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper className="p-4">
              <HighchartsReact
                highcharts={Highcharts}
                options={talentWeeklyChartOptions}
              />
            </Paper>
          </Grid>
        </Grid>
      </main>
      <DetailsModal />
    </div>
  );
}
