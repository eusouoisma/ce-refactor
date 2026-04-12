import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    width: 100%;
    height: 100vh;
`;

export const Title = styled.h1`
    font-size: 24px;
    font-weight: 500;
    color: #333;
    margin-bottom: 20px;
`;

export const InputContainer = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
`;

export const StyledInput = styled.input`
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;

    &:focus {
        outline: none;
        border-color: #666;
    }
`;

export const StyledSelect = styled.select`
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    min-width: 200px;
    background-color: white;

    &:focus {
        outline: none;
        border-color: #666;
    }

    &:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }
`; 