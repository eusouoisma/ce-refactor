import styled from "styled-components";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";

const Main = styled.div`
  min-width: ${(props) => (props.sidebarclosed === "true" ? "30px" : "300px")};
  border-right: solid 1px #ccc;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
  align-items: center;
  position: relative;
  z-index: 999;
  min-height: 100%;
`;

const Logo = styled.img`
  width: 100px;
  display: ${(props) => (props.sidebarclosed === "true" ? "none" : "block")};
`;

const Navigation = styled.ul`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  display: ${(props) => (props.sidebarclosed === "true" ? "none" : "block")};
`;

const NavigationItem = styled.li`
  flex-direction: column;

  display: ${(props) => (props.hide === "true" ? "none" : "flex")};

  a {
    color: #000;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin-top: -10px;
    margin-bottom: -10px;
    padding: 10px 0;
  }
`;

const NavigationItemTitle = styled.div`
  display: ${(props) => (props.hide === "true" ? "none" : "flex")};
  gap: 10px;
  padding: 10px 0;
  text-align: left;
  align-items: center;
  position: relative;
  border-bottom: solid 1px #000;
  width: 100%;
  cursor: pointer;

  &::after {
    position: absolute;
    right: 0;
    width: 10px;
    height: 10px;
    content: "";
    border-right: solid 1px #000;
    border-bottom: solid 1px #000;
    transform: ${(props) =>
      props.opened === "true" ? "rotate(-135deg)" : "rotate(45deg)"};
    top: calc(50% - 5px);

    display: ${(props) => (props.subitems === "true" ? "block" : "none")};
  }
`;

const NavigationItemUl = styled.ul`
  display: ${(props) => (props.opened === "true" ? "flex" : "none")};
  list-style-type: square;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
`;

const NavigationSubItem = styled.li`
  cursor: pointer;
  display: ${(props) => (props.hide === "true" ? "none" : "flex")};

  a {
    color: #000;
    text-decoration: none;
    width: 100%;
  }

  display: ${(props) => (props.hide === "true" ? "none" : "list-item")};
`;

const CloseSidebarButton = styled(CloseFullscreenIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  right: 20px;
  transform: ${(props) =>
    props.sidebarclosed === "true" ? "rotate(180deg)" : "none"};
`;

const OpenSidebarButton = styled(OpenInFullIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  top: 40px;
`;

const GoBackButton = styled(ChevronLeftIcon)`
  background: #ccc;
  padding: 5px;
  border-radius: 10px;
  cursor: pointer;
  position: absolute;
  left: ${(props) => (props.sidebarclosed === "true" ? "0px" : "20px")};
`;

const ExitButton = styled.button`
  position: fixed;
  right: 30px;
  background: #ccc;
  padding: 5px;
  border-radius: 5px;
  color: #000;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  text-transform: uppercase;
`;

const CurrentYear = styled.span`
  font-size: 20px;
  font-weight: 600;
  display: ${(props) => (props.sidebarclosed === "true" ? "none" : "block")};
`;

const StickySidebar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 20px;
  align-items: center;
  justify-content: flex-start;
`;

const DayOrderCountDown = styled.div`
  display: ${(props) => (props.sidebarclosed === "true" ? "none" : "grid")};
  grid-template-areas: "title title title" "hours minutes seconds";
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 100px;
  font-size: 15px;
  gap: 5px;
  text-align: center;

  .title {
    grid-area: title;
    font-size: 15px;
    background: #000;
    color: #fff;
    padding: 5px;
    font-weight: 600;
  }

  .hours {
    grid-area: hours;
    font-size: 30px;
    background: #000;
    color: #fff;
    padding: 5px;
    font-weight: 600;
  }

  .minutes {
    grid-area: minutes;
    font-size: 30px;
    background: #000;
    color: #fff;
    padding: 5px;
    font-weight: 600;
  }

  .seconds {
    grid-area: seconds;
    font-size: 30px;
    background: #000;
    color: #fff;
    padding: 5px;
    font-weight: 600;
  }
`;

export {
  Main,
  Logo,
  Navigation,
  NavigationItem,
  NavigationItemUl,
  NavigationSubItem,
  NavigationItemTitle,
  CloseSidebarButton,
  OpenSidebarButton,
  GoBackButton,
  ExitButton,
  CurrentYear,
  StickySidebar,
  DayOrderCountDown,
};
