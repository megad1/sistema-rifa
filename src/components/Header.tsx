// src/components/Header.tsx

import Image from 'next/image';

const Header = () => {
  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto max-w-3xl flex justify-between items-center px-4">
        <button className="text-black text-3xl">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <div className="flex-grow text-center">
          <Image
            src="https://incs-bucket.s3.amazonaws.com/20250131_679d39cec9e99.png"
            alt="Wesley Alemão"
            width={150}
            height={40}
            className="inline-block"
          />
        </div>
        <div className="text-right">
            <a href="/meus-numeros" className="text-black text-decoration-none flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <div className="text-yellow-500 text-xs font-bold">Meus títulos</div>
            </a>
        </div>
      </div>
      <div className="border-t border-gray-200 mt-4">
        <div className="container mx-auto max-w-3xl px-4 py-2">
            <ul className="flex justify-center space-x-8 text-sm">
                <li><a href="/campanhas" className="text-black font-semibold border-b-2 border-yellow-500 pb-1">Campanhas</a></li>
                <li><a href="/meus-numeros" className="text-gray-600 hover:text-black">Meus títulos</a></li>
            </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
