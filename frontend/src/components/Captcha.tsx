import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export const Captcha: React.FC<CaptchaProps> = ({ onVerify }) => {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setUserInput('');
    setIsValidated(null);
    onVerify(false);
  };

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    if (captchaCode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background noise
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw random lines
        for (let i = 0; i < 5; i++) {
          ctx.strokeStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.4)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.stroke();
        }

        // Draw character blocks
        ctx.font = 'bold 24px monospace';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < captchaCode.length; i++) {
          const char = captchaCode[i];
          const x = 15 + i * 22;
          const y = canvas.height / 2 + (Math.random() * 10 - 5);
          const angle = (Math.random() * 30 - 15) * Math.PI / 180;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.8)`;
          ctx.fillText(char, 0, 0);
          ctx.restore();
        }

        // Random dots
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.3)`;
          ctx.beginPath();
          ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [captchaCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);
    if (val.length === 6) {
      const match = val.toLowerCase() === captchaCode.toLowerCase();
      setIsValidated(match);
      onVerify(match);
    } else {
      setIsValidated(null);
      onVerify(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Security Verification
      </label>
      <div className="flex items-center space-x-3">
        <canvas 
          ref={canvasRef} 
          width={150} 
          height={40} 
          className="rounded border border-slate-200 dark:border-slate-800 bg-white"
        />
        <button
          type="button"
          onClick={generateCode}
          className="p-2 text-slate-500 hover:text-emerald-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh CAPTCHA"
        >
          <RefreshCw size={18} />
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            value={userInput}
            onChange={handleInputChange}
            placeholder="Enter code"
            className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-slate-900 transition-all focus:outline-none ${
              isValidated === true
                ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                : isValidated === false
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
        </div>
      </div>
      {isValidated === false && (
        <p className="text-xs text-red-500">Security code matches incorrectly. Please try again.</p>
      )}
    </div>
  );
};
