import styled from "styled-components";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import TuneTwoToneIcon from "@mui/icons-material/TuneTwoTone";
import RemoveDoneIcon from "@mui/icons-material/RemoveDone";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { Tooltip } from "@mui/material";

const Main = styled.div`
  background: #fcfcfc;
  position: relative;
  width: 100%;
  display: flex;
  min-height: 100vh;
`;

const HeaderText = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #000;
`;

const SubTitle = styled.span`
  text-transform: uppercase;
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin-top: 15px;
`;

const Title = styled.span`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  display: block;
`;

const Table = styled.table`
  overflow-x: scroll;
  white-space: nowrap;
  text-align: center;
  border-spacing: 0;
  border-radius: 5px;
  border: solid 1px #ccc;
  width: 100%;

  thead {
    background: #e6e6e6;
    height: 50px;
  }

  thead th {
    border-bottom: solid 1px #ccc;
    cursor: pointer;
  }

  tbody input {
    height: 0px;
  }

  .blocked {
    cursor: not-allowed;
    opacity: 0.1;
    pointer-events: none;

    input {
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  tr {
    &.invalid {
      color: red;
    }

    &.pointer:hover {
      background: aqua !important;
      cursor: pointer;
      border-radius: 5px;
    }
  }

  .guide-tours {
    .MuiInputBase-root {
      input {
        width: 45px !important;
      }
    }
  }

  &.tours-list {
    tr {
      border-bottom: solid 1px #ccc;
    }
    tr:nth-child(2n) {
      background: #e7e7e7;
    }
    td:not(:last-child) {
      border-right: solid 1px #ccc;
    }
  }
`;

const TableActions = styled.table`
  border-spacing: 0;
  th {
    display: flex;
    align-items: center;
  }

  thead {
    display: flex;
    align-items: center;
    height: 50px;
  }

  tr {
    display: flex;
    align-items: center;
    height: 35px;
  }

  td {
    display: flex;
    align-items: center;
  }
`;

const Tables = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
  width: 100%;
`;

const DeleteButton = styled(DeleteTwoToneIcon)`
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  background: #d55b5b;
`;

const EditButton = styled(TuneTwoToneIcon)`
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  background: #f4f46a;
`;

const FulfillButton = styled(DoneAllIcon)`
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  background: #7fd87f;
`;

const RemoveFulfillButton = styled(RemoveDoneIcon)`
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  background: #d55b5b;
`;

const ToursList = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  margin-top: 5px;
`;

const TourListTooltip = styled(Tooltip)``;

const PrintDocMark = styled.div`
  border: solid 1px #000;
  width: max-content;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  position: relative;
`;

const PrintDoc = styled.div`
  padding: 30px;
  text-align: center;
  max-width: 1000px;
  min-width: 1000px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const DonwloadDoc = styled.div`
  display: none;
`;

const ButtonArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin: 0 auto;
  margin-top: 20px;
  max-width: 1000px;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;

  > div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
`;

const EmployeeLine = styled.tr`
  .MuiAutocomplete-root {
    display: inline-block;
    width: 100%;
  }
  .MuiFormControl-root {
    width: 100%;
  }
  .MuiAutocomplete-inputRoot {
    padding-left: 2px !important;
    padding-right: 2px !important;
    font-size: 13px !important;
    min-width: 150px;
    width: 100%;
    text-align: center;
  }
  &.invalid {
    background: #c24f4f;
  }
  input {
    font-size: 13px;
    padding-left: 8px;
    text-align: center;
  }
  &.bloqueio td input {
    color: red;
  }
  &.dayoff td:last-child input {
    color: red;
  }
  &.bloqueio td {
    color: red;
  }
  &.dayoff td:last-child {
    color: red;
  }
`;

const AddEmployeeIcon = styled(AddCircleIcon)`
  cursor: pointer;
  width: 100% !important;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalBox = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  border: 2px solid #000;
  box-shadow: 24;
  padding: 10px;
  background: #fff;
`;

const LastEdit = styled.span`
  position: absolute;
  margin-top: -20px;
`;

const Blocked = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #a628284d;
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;

  span {
    font-size: 20px;
    color: #fff;
  }
`;

export {
  Main,
  HeaderText,
  SubTitle,
  Title,
  Table,
  TableActions,
  Tables,
  DeleteButton,
  EditButton,
  FulfillButton,
  RemoveFulfillButton,
  ToursList,
  PrintDoc,
  PrintDocMark,
  ButtonArea,
  EmployeeLine,
  AddEmployeeIcon,
  TourListTooltip,
  ModalBox,
  LastEdit,
  Blocked,
  DonwloadDoc,
};
