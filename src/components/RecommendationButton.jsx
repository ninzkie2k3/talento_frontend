import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'; // Add this import

const StyledButton = styled(Button)({
    width: 'fit-content',
    display: 'flex',
    alignItems: 'center',
    padding: '1.2em 1rem',
    cursor: 'pointer',
    gap: '0.4rem',
    fontWeight: 'bold',
    borderRadius: '30px',
    textShadow: '2px 2px 3px rgb(136 0 136 / 50%)',
    background: 'linear-gradient(15deg, #880088, #aa2068, #cc3f47, #de6f3d, #f09f33, #de6f3d, #cc3f47, #aa2068, #880088) no-repeat',
    backgroundSize: '300%',
    color: '#fff',
    border: 'none',
    backgroundPosition: 'left center',
    boxShadow: '0 30px 10px -20px rgba(0,0,0,.2)',
    transition: 'background .3s ease',
    '&:hover': {
      backgroundSize: '320%',
      backgroundPosition: 'right center',
    },
    '&:hover svg': {
      fill: '#fff',
    },
    '& svg': {
      width: '23px',
      fill: '#f09f33',
      transition: '.3s ease',
    },
  });

const RecommendationButton = () => {
    const navigate = useNavigate(); // Initialize the navigate function

    const handleClick = () => {
        navigate('/recommendation'); // Navigate to recommendation page
    };

    return (
        <StyledButton onClick={handleClick}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24">
                <path d="M18 0L26 12L36 4L32 24H4L0 4L10 12L18 0Z" />
            </svg>
            Click to find Recommendation
        </StyledButton>
    );
}

export default RecommendationButton;
