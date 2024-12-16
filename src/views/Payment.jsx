import React, { useState } from 'react';

export default function Payment() {
    const [selectedPayment, setSelectedPayment] = useState("gcash");
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const handlePaymentChange = (event) => {
        setSelectedPayment(event.target.value);
    };

    const handleConfirm = () => {
        setBookingSuccess(true);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            {bookingSuccess && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    Booking successful!
                </div>
            )}
            <h1 className="text-3xl font-bold mb-4">Payment Method</h1>
            <div className="mb-8">
                <h2 className="text-xl font-bold">Event Details Summary</h2>
                <p>Event Name: Clifford's Birthday</p>
                <p>Event Theme: Normal Party</p>
                <p>Event Date: July 9, 2024 | 6:00pm-8:00pm</p>
                <p>Event Duration: 2 hours</p>
                <p>Location: Paknaan, Mandaue City</p>
                <p>Talent Rate per Hour: ₱500</p>
                <p>Selected Event Duration: 2 hours</p>
                <p>Total payment to make: ₱1,000</p>
            </div>
            <div className="flex justify-around">
                <div className="w-full max-w-xs">
                    <input
                        type="radio"
                        id="gcash"
                        name="payment"
                        value="gcash"
                        checked={selectedPayment === "gcash"}
                        onChange={handlePaymentChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="gcash"
                        className={`border p-4 rounded-lg flex flex-col items-center ${selectedPayment === "gcash" ? "border-blue-500" : "border-gray-300"}`}
                    >
                        <h3 className="text-xl font-bold">Gcash</h3>
                        <p>Please make your payment to the account given.</p>
                        <p>Account Name: Nino Rey G.</p>
                        <p>Account Number: 09202297698</p>
                        <img src="path/to/gcash-qr.png" alt="Gcash QR Code" className="w-24 h-24 my-4"/>
                        <input type="file" className="mb-2"/>
                        <input type="text" placeholder="Account Name" className="w-full mb-2 px-2 py-1 border rounded"/>
                        <input type="text" placeholder="Account Number" className="w-full mb-2 px-2 py-1 border rounded"/>
                        <input type="text" placeholder="Amount" className="w-full mb-2 px-2 py-1 border rounded"/>
                        <input type="text" placeholder="Transaction ID (UTR, Reference No.)" className="w-full mb-2 px-2 py-1 border rounded"/>
                    </label>
                </div>
                <div className="w-full max-w-xs">
                    <input
                        type="radio"
                        id="paymaya"
                        name="payment"
                        value="paymaya"
                        checked={selectedPayment === "paymaya"}
                        onChange={handlePaymentChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="paymaya"
                        className={`border p-4 rounded-lg flex flex-col items-center ${selectedPayment === "paymaya" ? "border-blue-500" : "border-gray-300"}`}
                    >
                        <h3 className="text-xl font-bold">Paymaya</h3>
                        <p>Please make your payment to the account given.</p>
                        <p>Account Name: Nino Rey G.</p>
                        <p>Account Number: 09202297698</p>
                        <img src="path/to/paymaya-qr.png" alt="Paymaya QR Code" className="w-24 h-24 my-4"/>
                        <input type="file" className="mb-2"/>
                        <input type="text" placeholder="Account Name" className="w-full mb-2 px-2 py-1 border rounded"/>
                        <input type="text" placeholder="Account Number" className="w-full mb-2 px-2 py-1 border rounded"/>
                        <input type="text" placeholder="Amount" className="w-full mb-2 px-2 py-1 border rounded"/>
                        <input type="text" placeholder="Transaction ID (UTR, Reference No.)" className="w-full mb-2 px-2 py-1 border rounded"/>
                    </label>
                </div>
            </div>
            <div className="mt-6 text-center">
                <button onClick={handleConfirm} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700">Confirm</button>
            </div>
        </div>
    );
}
