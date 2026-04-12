import { Box } from "@mui/material";
import styled from "styled-components";

const Main = styled.div`
  background: #fcfcfc;
  position: relative;
  width: 100%;
  display: flex;
  min-height: 100vh;
`;

const Content = styled.div`
  padding-top: 50px;
  padding-left: 50px;
  padding-right: 50px;
  padding-bottom: 50px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 800px;
`;

const SubTitle = styled.span`
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 600;
  color: #728095;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  display: block;
`;

const FormBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  display: flex;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.column ? "column" : "row")};
  gap: ${(props) => (props.noGap ? "0" : "20px")};
  width: 100%;
  align-items: center;

  & > div {
    width: 100%;
    display: flex;
    gap: 20px;
  }
`;

const TicketsContainer = styled.div`
  border: solid 1px #ccc;
  border-radius: 4px;
  padding: 15px;
  width: auto !important;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TicketsRow = styled.div`
  display: grid;
  grid-template-columns: 2.5fr 1.3fr 1fr 1fr 1fr;
  gap: 10px;
  width: 100%;
`;

const TransferGroup = styled.div`
  display: flex;
  border: solid 1px #ccc;
  border-radius: 4px;
  padding: 5px;
  align-items: center;
`;

export {
  Main,
  SubTitle,
  Content,
  Title,
  FormBox,
  FormRow,
  TicketsContainer,
  TicketsRow,
  TransferGroup,
};
