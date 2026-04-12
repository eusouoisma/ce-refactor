import styled from "styled-components";
import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import { Box } from "@mui/material";

const Content = styled.div`
  padding-top: 50px;
  padding-left: ${(props) => (props.sidebarclosed === "true" ? "5px" : "50px")};
  padding-right: ${(props) =>
    props.sidebarclosed === "true" ? "5px" : "50px"};
  padding-bottom: 50px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: ${(props) =>
    props.sidebarclosed === "true"
      ? "calc(100% - 90px)"
      : "calc(100% - 450px)"};
  justify-content: flex-start;
`;

const Filter = styled.div`
  align-self: center;
  min-width: 200px;
  position: fixed;
  display: ${(props) => (props.opened === "true" ? "flex" : "none")};
  flex-direction: column;
  background: #fff;
  border: solid 1px #00000050;
  border-radius: 5px;
  z-index: 10;
  padding: 10px;
  top: 150px;
  z-index: 9999;

  form {
    width: 100%;
  }

  .MuiFormGroup-root {
    align-items: center;
  }

  ul {
    padding-left: 0;
    list-style-type: none;
    max-height: 270px;
    overflow-y: auto;
    width: 100%;

    li {
      padding-left: 0;
      display: flex;
      justify-content: flex-start;
    }
  }

  input[type="date"][value=""],
  input[type="time"][value=""] {
    color: transparent;
  }

  .Mui-focused input[type="date"][value=""],
  .Mui-focused input[type="time"][value=""] {
    color: initial;
  }

  .date-filter {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .filters-actions {
    display: flex;
    gap: 20px;

    span {
      cursor: pointer;
    }
  }

  .filters-search {
    display: flex;
    margin-top: 15px;

    .MuiInputBase-root {
      width: 100%;
    }

    .MuiFormControl-root {
      width: 100%;
    }
  }
`;

const FilterTitle = styled.span`
  font-size: 20px;
  font-weight: 500;
`;

const CloseFilter = styled(CloseIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  right: 5px;
  top: 5px;
`;

const PageHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  margin-top: 15px;

  > div {
    display: flex;
    justify-content: center;
  }
`;

const Logo = styled.img`
  width: 250px;
`;

const Indicators = styled.table`
  min-width: 300px;
  margin: 0 auto;
  text-align: center;
  border-radius: 5px;
  border: solid 1px #ccc;
  padding: 0;
  border-spacing: 0;

  thead {
    background: #00cbff;

    th {
      border-bottom: solid 1px #ccc;
      &:not(:first-child) {
        border-left: solid 1px #ccc;
      }
    }
  }

  tbody {
    tr {
      td:not(:first-child) {
        border-left: solid 1px #ccc;
      }
    }
  }
`;

const FulfillModal = styled.div`
  width: 300px;
  position: fixed;
  display: ${(props) => (props.opened === "true" ? "flex" : "none")};
  color: #545454;
  flex-direction: column;
  background: #fff;
  border: solid 1px #00000050;
  border-radius: 5px;
  z-index: 10;
  padding: 10px;
  top: 200px;
  left: calc(50% - 150px);

  .MuiFormControlLabel-label {
    text-transform: capitalise;
  }

  button {
    width: max-content;
    margin: 0 auto;
    margin-top: 10px;
  }
`;

const FulfillModalTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 15px;
  padding-right: 50px;
`;

const CloseFulfillModal = styled(CloseIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  right: 5px;
  top: 5px;
`;

const FormBox = styled(Box)`
  display: flex;
  flex-direction: column;
  display: flex;
`;

const Overlay = styled.div`
  display: ${(props) => (props.opened === "true" ? "flex" : "none")};
  background: rgba(0, 0, 0, 0.4);
  width: 100%;
  height: 100%;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
`;

const DownloadExcelWrapper = styled.div`
  width: max-content;
`;

const HaveCommentsIcon = styled(CommentIcon)`
  position: absolute;
  top: -5px;
  left: 0;
`;

const HaveChangeRequestsIcon = styled(PublishedWithChangesIcon)`
  position: absolute;
  top: -5px;
  left: 20px;
`;

const ClientsModal = styled.div`
  width: 500px;
  position: fixed;
  display: ${(props) => (props.opened === "true" ? "flex" : "none")};
  color: #545454;
  flex-direction: column;
  background: #fff;
  border: solid 1px #00000050;
  border-radius: 5px;
  z-index: 10;
  padding: 10px;
  top: 200px;
  left: calc(50% - 150px);

  .MuiFormControlLabel-label {
    text-transform: capitalise;
  }

  button {
    width: max-content;
    margin: 0 auto;
    margin-top: 10px;
  }
`;

const ClientsModalTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 15px;
  padding-right: 50px;
`;

const CloseClientsModal = styled(CloseIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  right: 5px;
  top: 5px;
`;

const ClientsModalList = styled.ul``;

export {
  Content,
  Filter,
  FilterTitle,
  CloseFilter,
  Indicators,
  FulfillModal,
  FulfillModalTitle,
  CloseFulfillModal,
  FormBox,
  DownloadExcelWrapper,
  Overlay,
  HaveCommentsIcon,
  HaveChangeRequestsIcon,
  ClientsModal,
  ClientsModalTitle,
  CloseClientsModal,
  ClientsModalList,
  PageHeader,
  Logo,
};
