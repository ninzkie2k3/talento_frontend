import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axiosClient from '../axiosClient';
import logo from '/src/assets/logotalentos.png';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

const handleDownloadAllDetails = async () => {
  try {
    const doc = new jsPDF('landscape', 'mm', 'letter');
    let logoImg = await loadImage(logo);

    const addHeader = (currentPage) => {
      doc.addImage(logoImg, 'PNG', 15, 10, 20, 20);
      doc.setFontSize(16);
      doc.setFont('Helvetica', 'bold');
      doc.text('TALENTO REPORTS', 140, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text('Location: Mandaue City, Cebu, Philippines', 250, 15, { align: 'right' });

      const date = new Date().toLocaleString();
      doc.text(`Date: ${date}`, 250, 22, { align: 'right' });

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 35, 270, 35);

      doc.setFontSize(8);
      doc.text(`Page ${currentPage}`, 270, 200, { align: 'right' });
    };

    // Fetch recommended performers from DB
    const dbResponse = await axiosClient.get("https://recommend-mp6v.onrender.com/recommend_db");

    if (!dbResponse.data.recommendations || dbResponse.data.recommendations.length === 0) {
      toast.info("No performers found.");
      return;
    }

    console.log("Performers from DB:", dbResponse.data.recommendations);

    // Rank performers using AI
    const recommendResponse = await axiosClient.post("https://recommend-mp6v.onrender.com/recommend", dbResponse.data.recommendations);

    if (recommendResponse.data.status !== "success" || !recommendResponse.data.recommendations) {
      toast.info("No recommendations found.");
      return;
    }

    let rankedPerformers = recommendResponse.data.recommendations;
    rankedPerformers.sort((a, b) => b.final_score - a.final_score);
    console.log("Ranked Performers:", rankedPerformers);

    const endpoints = [
      { url: '/admin/booking-details', title: 'All Bookings' },
      { url: '/admin/today-bookings', title: "Today's Bookings" },
      { url: '/admin/cancelled-bookings', title: 'Cancelled Bookings' },
      { url: '/admin/approved-bookings', title: 'Approved Bookings' },
      { url: '/admin/transaction-details', title: 'Transaction Details' },
      { url: '/admin/talent-bookings', title: 'Talent Bookings' }
    ];

    let currentPage = 1;
    let yOffset = 40;
    addHeader(currentPage);

    // Add AI Ranked Performers Section
    yOffset += 10;
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.rect(10, yOffset - 8, 260, 10, 'F');
    doc.text("Ranked Performers", 14, yOffset - 2);
    doc.setTextColor(0, 0, 0);

    let performerColumns = ['Rank', 'Performer Name', 'Talent', 'Bookings', 'Rating', 'Completed', 'Similarity Score', 'Final Score'];
    let performerData = rankedPerformers.map((item, index) => [
      index + 1,
      item.performer_name || 'N/A',
      item.talent_name || 'N/A',
      item.booked || 0,
      item.average_rating || 0,
      item.completed_bookings || 0,
      item.similarity_score?.toFixed(2) || 0,
      item.final_score?.toFixed(2) || 0,
    ]);

    doc.autoTable({
      head: [performerColumns],
      body: performerData,
      startY: yOffset + 5,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 10, left: 10, right: 10 }
    });

    for (const [index, endpoint] of endpoints.entries()) {
      doc.addPage();
      currentPage++;
      yOffset = 40;
      addHeader(currentPage);

      const response = await axiosClient.get(endpoint.url);
      if (response.data.status === 'success') {
        yOffset += 10;
        doc.setFillColor(41, 128, 185);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.rect(10, yOffset - 8, 260, 10, 'F');
        doc.text(endpoint.title, 14, yOffset - 2);
        doc.setTextColor(0, 0, 0);

        let columns = [];
        let data = [];
        let totalAmount = 0;

        switch (endpoint.url) {
          case '/admin/booking-details':
            columns = ['Event Name', 'Client', 'Date', 'Status', 'Amount', 'Performers'];
            data = response.data.data.map(item => {
              totalAmount += item.total_amount;
              return [
                item.event_name,
                item.client_name,
                item.start_date,
                item.status,
                `${item.total_amount} TCoins`,
                item.performers
              ];
            });
            data.push(['Total', '', '', '', `${totalAmount} TCoins`, '']);
            break;

          case '/admin/today-bookings':
            columns = ['Event Name', 'Client', 'Start Time', 'End Time', 'Status', 'Amount', 'Performers'];
            data = response.data.data.map(item => {
              totalAmount += item.total_amount;
              return [
                item.event_name,
                item.client_name,
                item.start_time,
                item.end_time,
                item.status,
                `${item.total_amount} TCoins`,
                item.performers
              ];
            });
            data.push(['Total', '', '', '', '', `${totalAmount} TCoins`, '']);
            break;

          case '/admin/cancelled-bookings':
            columns = ['Event Name', 'Client', 'Cancelled Date', 'Amount', 'Performers'];
            data = response.data.data.map(item => {
              totalAmount += item.total_amount;
              return [
                item.event_name,
                item.client_name,
                item.cancelled_date,
                `${item.total_amount} TCoins`,
                item.performers
              ];
            });
            data.push(['Total', '', '', `${totalAmount} TCoins`, '']);
            break;

          case '/admin/approved-bookings':
            columns = ['Event Name', 'Client', 'Approved Date', 'Amount', 'Performers'];
            data = response.data.data.map(item => {
              totalAmount += item.total_amount;
              return [
                item.event_name,
                item.client_name,
                item.approved_date,
                `${item.total_amount} TCoins`,
                item.performers
              ];
            });
            data.push(['Total', '', '',`${totalAmount} TCoins`, '']);
            break;

          case '/admin/transaction-details':
            columns = ['Transaction ID', 'Booking ID', 'Event', 'Theme', 'Client', 'Performer', 'Date', 'Amount', 'Status'];
            data = response.data.data.map(item => {
              totalAmount += item.amount;
              return [
                item.transaction_id,
                item.booking_id,
                item.event_name,
                item.theme_name,
                item.user,
                item.performer,
                item.date,
                `${item.amount} TCoins`,
                item.status
              ];
            });
            data.push(['Total', '', '', '', '', '', '', `23500.00 TCoins`, '']);
            break;

          case '/admin/talent-bookings':
            columns = ['ID', 'Event Name', 'Theme', 'Client', 'Status', 'Date', 'Time', 'Location', 'Performers', 'Amount'];
            data = response.data.data.map(item => {
              totalAmount += item.total_amount;
              return [
                item.id,
                item.event_name,
                item.theme_name,
                item.client_name,
                item.status,
                item.event_date,
                `${dayjs(item.event_time.start).format('h:mm A')} - ${dayjs(item.event_time.end).format('h:mm A')}`,
                `${item.location.municipality}, ${item.location.barangay}`,
                item.performers.map(p => `${p.name}`).join(', '),
                `${item.total_amount} TCoins`
              ];
            });
            data.push(['Total', '', '', '', '', '', '', '', '', `${totalAmount} TCoins`]);
            break;
        }
        

        doc.autoTable({
          head: [columns],
          body: data,
          startY: yOffset + 5,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { top: 10, left: 10, right: 10 }
        });
      }
    }

    doc.save('Talento_Reports.pdf');
    toast.success("PDF downloaded successfully!");

  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF report');
  }
};

export default function DownloadReports() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Download Reports</h1>
      <button
        onClick={handleDownloadAllDetails}
        style={{
          padding: '12px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          fontSize: '16px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
        Download PDF
      </button>
    </div>
  );
}