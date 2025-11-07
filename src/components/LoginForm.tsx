import React, { useState } from 'react';
import loginBg1 from '../assets/images/login-bg-1.svg';
import loginBg2 from '../assets/images/login-bg-2.svg';

interface LoginFormProps {
  onLogin?: (data: { userId: string, token: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('kc@gmail.com');
    const [password, setPassword] = useState('123');
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const isEmailInvalid = wasSubmitted && email !== '' && email !== 'kc@gmail.com';
  const isPasswordInvalid = wasSubmitted && password !== '' && password !== '123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWasSubmitted(true);
    if (email === 'kc@gmail.com' && password === '123') { // todo хардкод логина и пароля
      if (onLogin) onLogin({ userId: '1', token: 'user-token-123' }); // todo пока хардкод пользователя
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWasSubmitted(false);
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWasSubmitted(false);
    setPassword(e.target.value);
  };

  return (
    <div 
      className="min-h-screen w-screen flex items-center justify-center rounded-2xl" 
      style={{ 
                        backgroundColor: '#212121', 
        backgroundImage: `url(${loginBg1}), url(${loginBg2})`,
        backgroundPosition: 'bottom left, bottom right',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'auto, auto'
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="p-10 min-w-88 flex flex-col gap-4.5 text-white"
        style={{ 
                          backgroundColor: '#2A2A2A',
          borderRadius: '24px',
          border: '1px solid #50504e'
        }}
      >
        <div className="text-title mb-0">
          Welcome to BGOS
          <div className="text-subtitle mb-2.5 mt-1">
          <p className='text-white'>Some text about this section</p>
        </div>
        </div>
     
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleEmailChange}
          required
          className="text-body border-none rounded-xl p-3.5 mb-1.5 outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ backgroundColor: 'rgb(48, 48, 46)', border: isEmailInvalid ? '1px solid #ff4444' : '1px solid #3A3A3A', }}
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={handlePasswordChange}
          required
          className="text-body border-none rounded-xl p-3.5 mb-1.5 outline-none focus:ring-2 focus:ring-opacity-50"
                      style={{ backgroundColor: 'rgb(48, 48, 46)', border: isPasswordInvalid ? '1px solid #ff4444' : '1px solid #3A3A3A', }}
        />
        <button
          type="submit"
          className="text-button border-none rounded-3xl py-3.5 mt-2 cursor-pointer transition-colors duration-200"
          style={{ backgroundColor: '#ffd900' }}
        >
          Log In
        </button>
        <div className="text-disclaimer mt-2.5 text-center">
          By continuing you agree to BGOS <a href="#" className=" underline">Consumer Terms</a> and <a href="#" className=" underline">Usage Policy</a>, and acknowledge our <a href="#" className=" underline">Privacy Policy</a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm; 