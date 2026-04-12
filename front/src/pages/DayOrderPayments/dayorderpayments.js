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
  border: solid 1px #000;
  max-height: 65vh;
  width: 100%;

  * {
    font-size: 16px;
  }

  thead {
    background: #e6e6e6;
    height: 50px;
  }

  thead th {
    border-bottom: solid 1px #000;
    border-right: solid 1px #000;
    cursor: pointer;
    position: sticky;
    background: #00cbff;
    top: 0px;
    z-index: 9;
  }

  thead th.active {
    background: #f4f46a;
  }

  tr {
    height: 35px;
    &.selected {
      td {
        background: #ff7c2f;
      }
    }
  }

  tr:not(:last-child) td {
    border-bottom: solid 1px #000;
  }

  tr.Confirmado td {
    background: #00ef00 !important;
  }

  tr.No.Show td {
    background: #00ef00 !important;
  }

  tr.Cancelado td {
    background: #ff0000 !important;
  }

  th {
    padding: 5px 5px;
  }

  td {
    padding: 0 5px;
    position: relative;
    width: 1%;
    border-right: solid 1px #000;
  }

  tr.fulfilled {
    background: #bcf1bf;
    td:nth-child(2n + 1) {
      background: #bcf1bf;
    }
  }

  td.numberOfGroups {
    input {
      padding: 5px;
      width: 50px;
      text-align: center;
    }
  }

  tbody {
    display: ${(props) =>
      props.loading === "true" ? "none" : "table-row-group"};
  }

  .MuiInputBase-input {
    padding: 5px;
    text-align: center;
    font-size: 16px;
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
  gap: 20px;
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

const SelectMonths = styled.div`
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  padding-bottom: 10px;

  .MuiFormControlLabel-root {
    display: flex;
    flex-direction: column-reverse;
  }
`;

export {
  Main,
  SubTitle,
  Title,
  Table,
  TableActions,
  Tables,
  DeleteButton,
  EditButton,
  FulfillButton,
  RemoveFulfillButton,
  SelectMonths,
};
