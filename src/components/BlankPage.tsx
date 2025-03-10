import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BlankPage.css';

const BlankPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="blank-page">
      <h1>空白页面</h1>
      <p>这是一个空白页面</p>
      <button className="back-button" onClick={handleBackClick}>
        返回首页
      </button>
    </div>
  );
};

export default BlankPage; 