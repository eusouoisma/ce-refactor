import styled from "styled-components";

import Box from "@mui/material/Box";

const Main = styled.div`
  background: #fcfcfc;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 100%;
  height: 100%;
`;

const Logo = styled.img`
  width: 200px;
`;

const Wrapper = styled.div`
  background: #fff;
  border: 1px solid #e6eaee;
  box-shadow: 0px 8px 24px rgba(21, 21, 22, 0.04);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 300px;
`;

const Title = styled.span`
  font-size: 20px;
  text-align: left;
  font-weight: bold;
`;

const FormBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PassWordWrapper = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  align-items: center;

  > div {
    width: 100%;
  }

  svg {
    position: absolute;
    right: 5px;
    cursor: pointer;
  }
`;

export { Main, Logo, Wrapper, Title, FormBox, PassWordWrapper };
