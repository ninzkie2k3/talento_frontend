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
  DialogTitle,
  IconButton
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
import CloseIcon from '@mui/icons-material/Close';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '/src/assets/logotalentos.png'; 
import DownloadReports from "../components/DownloadReports";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [detailsData, setDetailsData] = useState([]);

  
 
  const handleCardClick = async (cardType) => {
    setSelectedCard(cardType);
    try {
      const response = await axiosClient.get(`/admin/${cardType}`);
      if (response.data.status === 'success') {
        setDetailsData(response.data.data);
        setIsModalOpen(true);
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
      open={isModalOpen} 
      onClose={() => setIsModalOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle className="flex justify-between items-center">
        <Typography variant="h6">
          {selectedCardType === 'total_bookings' && 'All Bookings'}
          {selectedCardType === 'bookings_today' && "Today's Bookings"}
          {selectedCardType === 'cancelled_bookings' && 'Cancelled Bookings'}
          {selectedCardType === 'approved_bookings' && 'Approved Bookings'}
          {selectedCardType === 'sales' && 'Transaction Details'}
        </Typography>
        <IconButton onClick={() => setIsModalOpen(false)}>
          <CloseIcon />
        </IconButton>
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
      name: 'Completed',
      data: summary.monthly_statistics?.map(stat => stat.completed_bookings) || []
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

  
  const talentWeeklyChartOptions = {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Bookings By Talent (Weekly)'
    },
    xAxis: {
        categories: ['Week 0', 'Week 1']
    },
    yAxis: {
        title: {
            text: 'Number of Bookings'
        }
    },
    series: Object.entries(summary.talent_statistics?.by_week || {}).map(([name, data]) => ({
        name: name,
        data: Array.isArray(data.weekly_bookings) ? data.weekly_bookings : Object.values(data.weekly_bookings)
    }))
};


  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6"><DownloadReports/></div>

      <main ref={reportRef} className="flex-1 w-full bg-white p-6 rounded shadow">
        <Typography variant="h4" className="mb-6">Summary Report</Typography>

        <Grid container spacing={3} className="mb-6">
          {summaryCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
              <Card className={`${card.color} hover:shadow-lg transition-shadow`} onClick={() => handleCardClick('total_bookings')}>
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

