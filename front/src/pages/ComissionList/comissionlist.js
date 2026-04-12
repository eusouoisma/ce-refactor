import styled from "styled-components";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import TuneTwoToneIcon from "@mui/icons-material/TuneTwoTone";
import RemoveDoneIcon from "@mui/icons-material/RemoveDone";
import DoneAllIcon from "@mui/icons-material/DoneAll";

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
  max-width: calc(100% - 450px);
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

const Table = styled.table`
  overflow-x: scroll;
  white-space: nowrap;
  display: table-caption;
  text-align: center;
  border-spacing: 0;
  border-radius: 5px;
  border: solid 1px #ccc;

  thead {
    background: #e6e6e6;
    height: 50px;
  }

  thead th {
    border-bottom: solid 1px #ccc;
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
    padding: 10px 20px;
  }

  td {
    padding: 0 5px;
  }

  td:nth-child(2n + 1) {
    background: #00cbff;
  }
`;

const TableActions = styled.table`
  border-spacing: 0;
  white-space: nowrap;
  display: table-caption;
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
  gap: 20px;
`;

const ComissionRow = styled.tr`
  background: ${(props) => (props.paid === "true" ? "#bcf1bf" : "inherit")};

  &.selected {
    td {
      background: #ff7c2f;
    }
  }

  td {
    background: ${(props) =>
      props.paid === "true" ? "#bcf1bf !important" : "inherit"};
  }
`;

const DeleteButton = styled(DeleteTwoToneIcon)`
  background: #d55b5b;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
`;

const EditButton = styled(TuneTwoToneIcon)`
  background: #f4f46a;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
`;

const SelectMonths = styled.div`
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  padding-bottom: 10px;

  .MuiFormControlLabel-root {
    display: flex;
    flex-direction: column-reverse;
  }
`;

const PayButton = styled(DoneAllIcon)`
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  background: #7fd87f;
`;

const UnPayButton = styled(RemoveDoneIcon)`
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  background: #d55b5b;
`;

export {
  Main,
  SubTitle,
  Content,
  Title,
  Table,
  TableActions,
  Tables,
  DeleteButton,
  EditButton,
  ComissionRow,
  SelectMonths,
  PayButton,
  UnPayButton,
};
