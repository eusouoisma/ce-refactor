import { Box } from "@mui/material";
import styled from "styled-components";
import CloseIcon from "@mui/icons-material/Close";

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
  position: relative;
  justify-content: center;
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
  margin-bottom: ${(props) => (props.nomargin === "true" ? "0" : "20px")};
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
  align-items: flex-start;

  & > div {
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  input[type="date"][value=""],
  input[type="time"][value=""] {
    color: transparent;
  }

  .Mui-focused input[type="date"][value=""],
  .Mui-focused input[type="time"][value=""] {
    color: initial;
  }
`;

const FormButtons = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 20px;

  button {
    width: 50%;
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

const ComissionModal = styled.div`
  align-self: center;
  width: 500px;
  position: fixed;
  display: ${(props) => (props.opened === "true" ? "flex" : "none")};
  flex-direction: column;
  background: #fff;
  border: solid 1px #00000050;
  border-radius: 5px;
  z-index: 10;
  padding: 10px;
  top: 200px;

  form {
    width: 100%;
  }

  .MuiFormGroup-root {
    align-items: center;
  }

  button {
    width: max-content;
    margin: 0 auto;
  }
`;

const ComissionModalHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
`;

const ComissionModalTitle = styled.span`
  font-size: 20px;
  font-weight: 600;
`;

const ComissionModalClose = styled(CloseIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  right: 0px;
  top: 0px;
`;

const Table = styled.table`
  white-space: nowrap;
  display: table-caption;
  text-align: center;
  border-spacing: 0;
  border-radius: 5px;
  border: solid 1px #ccc;
  width: max-content;

  thead {
    background: #e6e6e6;
    height: 50px;
  }

  thead th {
    border-bottom: solid 1px #ccc;
    cursor: pointer;
  }

  thead th.active {
    background: #f4f46a;
  }

  tr {
    height: 35px;
  }

  tr:not(:last-child) td {
    border-bottom: solid 1px #ccc;
  }

  th {
    padding: 5px 5px;
  }

  td {
    padding: 0 5px;
    position: relative;

    .MuiFormControlLabel-root {
      display: flex;
      margin: 0;
      justify-content: center;
    }
  }

  td:nth-child(2n + 1) {
    background: #00cbff;
  }

  tr.fulfilled {
    background: #bcf1bf;
    td:nth-child(2n + 1) {
      background: #bcf1bf;
    }
  }

  tbody {
    display: ${(props) =>
      props.loading === "true" ? "none" : "table-row-group"};
  }
`;

export {
  Main,
  SubTitle,
  Content,
  Title,
  FormBox,
  FormRow,
  FormButtons,
  TicketsContainer,
  TicketsRow,
  TransferGroup,
  ComissionModal,
  ComissionModalHeader,
  ComissionModalTitle,
  ComissionModalClose,
  Table,
};
