import styled from "styled-components";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import TuneTwoToneIcon from "@mui/icons-material/TuneTwoTone";
import RemoveDoneIcon from "@mui/icons-material/RemoveDone";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ReplayIcon from "@mui/icons-material/Replay";

const Main = styled.div`
  background: #fcfcfc;
  position: relative;
  width: 100%;
  display: flex;
  min-height: 100vh;
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

const FilterWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;

  label {
    font-size: 14px;
    color: #555;
    display: flex;
    flex-direction: column;
  }

  input,
  select {
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 14px;
    margin-top: 4px;
    min-width: 160px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  th,
  td {
    padding: 12px 16px;
    text-align: left;
  }

  thead {
    background-color: #f0f2f5;

    th {
      font-size: 13px;
      text-transform: uppercase;
      color: #555;
      font-weight: 600;
    }
  }

  tbody tr {
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;

    &:hover {
      background-color: #f9f9f9;
    }
  }

  td {
    font-size: 14px;
    color: #333;
  }
`;

const ChartWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
  gap: 40px;
  margin-top: 40px;
  flex-wrap: wrap;
`;

const ChartBox = styled.div`
  flex: 1 1 48%;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

export {
  Main,
  SubTitle,
  Title,
  FilterWrapper,
  StyledTable,
  ChartWrapper,
  ChartBox,
  DeleteTwoToneIcon,
  TuneTwoToneIcon,
  RemoveDoneIcon,
  DoneAllIcon,
  ReplayIcon
};
