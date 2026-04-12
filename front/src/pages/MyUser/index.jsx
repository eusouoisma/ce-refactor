import React, { useState, useCallback, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import validator from "validator";

import { TextField, Button } from "@mui/material";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import Sidebar from "../../components/Sidebar";
import {
  Main,
  Title,
  FormBox,
  FormRow,
  SettingGroup,
  ContentInner,
} from "./myuser";

import { Content } from "../../utils/stylesbase";
import { API_URL } from "../../utils/env";

const MyUser = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [formsStatus, setFormsStatus] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const { sidebarClosed, userName, userUsername, token } =
    useContext(StoreContext);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (errorMessage !== "") return;

      fetch(`${API_URL}users/update.php`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          token,
        }),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Usuário atualizado corretamente</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: response.error,
            });
          }
        });
    },
    [errorMessage]
  );

  const onChange = useCallback(
    (e) => {
      let newFormData = formData;
      newFormData[e.target.name] = e.target.value;
      setFormData(newFormData);

      if (e.target.name === "password") validate(e.target.value);

      setFormsStatus(Math.random());
    },
    [formData]
  );

  const validate = (value) => {
    if (
      validator.isStrongPassword(value, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      setErrorMessage("");
    } else {
      setErrorMessage(
        "A senha precisa ter no mínimo 8 caracteres, contendo letras maiúsculas, minúsculas, números e símbolos"
      );
    }
  };

  useEffect(() => {
    let newFormData = formData;
    formData.name = userName;
    formData.username = userUsername;
    setFormData(newFormData);
    setFormsStatus(Math.random());
  }, [userName, userUsername]);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <Title>My User</Title>
        <ContentInner>
          <SettingGroup>
            <FormBox
              component="form"
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
              name="edit-my-user"
            >
              <FormRow>
                <TextField
                  id="username"
                  label="Username"
                  variant="outlined"
                  name="username"
                  onChange={onChange}
                  value={formData.username}
                  autoComplete="none"
                  required
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="name"
                  label="Nome"
                  variant="outlined"
                  name="name"
                  onChange={onChange}
                  value={formData.name}
                  required
                />
              </FormRow>
              <FormRow>
                <TextField
                  id="password"
                  label="Senha"
                  variant="outlined"
                  name="password"
                  onChange={onChange}
                  value={formData.password}
                  type="password"
                  autoComplete="new-password"
                  helperText="Deixe em branco se você não deseja mudar a senha"
                />
              </FormRow>
              {errorMessage !== "" && (
                <span
                  style={{
                    fontWeight: "bold",
                    color: "red",
                    maxWidth: "200px",
                  }}
                >
                  {errorMessage}
                </span>
              )}
              <FormRow>
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>
        </ContentInner>
      </Content>
    </Main>
  );
};

export default MyUser;
