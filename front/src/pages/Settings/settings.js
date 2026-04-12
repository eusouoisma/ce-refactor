import styled from "styled-components";
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import TuneTwoToneIcon from "@mui/icons-material/TuneTwoTone";
import { Box } from "@mui/material";

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

  tr {
    height: 50px;
  }

  tr:not(:last-child) td {
    border-bottom: solid 1px #ccc;
  }

  th {
    padding: 10px 20px;
  }

  td {
    padding: 10px;
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
    height: 50px;
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
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
`;

const EditButton = styled(TuneTwoToneIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
`;

const FormBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  display: flex;
  margin-top: 20px;
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

  input[type="date"][value=""] {
    color: transparent;
  }

  .Mui-focused input[type="date"][value=""] {
    color: initial;
  }
`;

const SettingGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: max-content;
`;

const ContentInner = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 50px;
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
  FormBox,
  FormRow,
  SettingGroup,
  ContentInner,
};
