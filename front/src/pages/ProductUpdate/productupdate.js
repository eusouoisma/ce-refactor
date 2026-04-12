import { Box } from "@mui/material";
import styled from "styled-components";
import AddCircleIcon from "@mui/icons-material/AddCircle";

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
  justify-content: center;
  gap: 20px;

  button {
    width: 100%;
  }
`;

const VariantsTitle = styled.span`
  font-size: 20px;
  font-weight: 600;
  display: block;
`;

const Variant = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 10px;
  padding-top: 10px;
  border-bottom: solid 1px #ccc;
`;

const AddVariantIcon = styled(AddCircleIcon)`
  cursor: pointer;
  width: 100% !important;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export {
  Main,
  SubTitle,
  Content,
  Title,
  FormBox,
  FormRow,
  FormButtons,
  VariantsTitle,
  Variant,
  AddVariantIcon,
};
