// src/components/MyTicketsBar.tsx

import Link from 'next/link';

const MyTicketsBar = () => {
    return (
        <Link href="/meus-titulos" passHref>
            <div className="bg-black text-white py-2 text-center w-full rounded-md cursor-pointer hover:bg-gray-800 transition-colors mb-2">
                <span className="font-semibold text-sm">
                    <i className="bi bi-ticket-perforated mr-2"></i> 
                    Meus títulos
                </span>
            </div>
        </Link>
    );
}

export default MyTicketsBar;
