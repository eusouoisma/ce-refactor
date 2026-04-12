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
  border: solid 1px #ccc;
  border-collapse: collapse;
  max-height: 75vh;

  thead {
    background: #e6e6e6;
    height: 50px;
  }

  thead th {
    border-bottom: solid 1px #ccc;
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

  tr.fulfilled {
    background: #bcf1bf;
    td:nth-child(2n + 1) {
      background: #bcf1bf;
    }
  }

  tr.separate {
    border-top: solid 3px #000;
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
};
