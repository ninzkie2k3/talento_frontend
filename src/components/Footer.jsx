
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebook, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-2">
            <div className="container mx-auto px-4 flex justify-between text-sm">
                <div>
                    <h3 className="font-semibold mb-1">About us</h3>
                    <ul className="space-y-1">
                        <li>Leadership</li>
                        <li>Our Mission</li>
                        <li>Our Vision</li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold mb-1">Contact us</h3>
                    <p>Email: talentoorgs@gmail.com</p>
                    <p>Contact #: (305) 321-7306</p>
                    <p>0987654321</p>
                </div>
                <div>
                    <h3 className="font-semibold mb-1">Help & Support</h3>
                    <ul className="space-y-1">
                        <li>Customer Support</li>
                        <li>Organizer Support</li>
                        <li>Terms of Service</li>
                        <li>Conditions of Service</li>
                        <li>Privacy Policy</li>
                        <li>Report a scam</li>
                    </ul>
                    <div className="flex space-x-2 mt-1">
                        <FontAwesomeIcon icon={faInstagram} className="text-xl" />
                        <FontAwesomeIcon icon={faFacebook} className="text-xl" />
                        <FontAwesomeIcon icon={faWhatsapp} className="text-xl" />
                    </div>
                </div>
            </div>
            <div className="text-center mt-2 text-sm">
                © Team WORK. All Rights Reserved.
            </div>
        </footer>
    );
}
