import React, { useContext } from "react";

import StoreContext from "../../components/Store/Context";

import Sidebar from "../../components/Sidebar";
import { Content, Main } from "./default";

const Default = () => {
  const { userName } = useContext(StoreContext);

  return (
    <Main>
      <Sidebar></Sidebar>
      <Content>
        <h2>
          Olá, {userName}, bem-vindo(a)! Utilize o menu lateral para acessar as
          funcionalidades do sistema.
        </h2>
      </Content>
    </Main>
  );
};

export default Default;
