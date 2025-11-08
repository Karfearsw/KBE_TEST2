import { useState, useEffect } from 'react';
import hero1 from '@/assets/hero1.png';
import hero2 from '@/assets/hero2.png';
import hero3 from '@/assets/hero3.png';
import hero4 from '@/assets/hero4.png';
import logoImage from '@assets/att.SfHLxwcc-OAmbbEv8bPkFW72vTErFOWPsSyakG77cIc.jpeg';

// Collection of motivational quotes
const quotes = [
  {
    text: "CLOSING DEALS, STACKING WINS",
    subtext: "FLIPSTACKK",
    image: hero1
  },
  {
    text: "TURN PROPERTIES INTO PROFITS",
    subtext: "YOUR NEXT WIN IS HERE",
    image: hero2
  },
  {
    text: "BUILD YOUR REAL ESTATE EMPIRE",
    subtext: "ONE DEAL AT A TIME",
    image: hero3
  },
  {
    text: "CONNECT. CLOSE. CASH IN.",
    subtext: "FLIPSTACKK",
    image: hero4
  }
];

export function MotivationalBanner() {
  // Choose a random quote on initial render
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Rotate quotes periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 10000); // Change quote every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const currentQuote = quotes[currentQuoteIndex];
  
  return (
    <div className="bg-neutral-900 dark:bg-black rounded-lg overflow-hidden relative text-white">
      <div className="relative">
        <div className="w-full h-48 md:h-56 bg-black">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="mb-3">
              <img 
                src={logoImage} 
                alt="FlipStackk Logo" 
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white">{currentQuote.text}</h2>
              {currentQuote.subtext && (
                <p className="text-xl md:text-2xl text-red-500">{currentQuote.subtext}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}