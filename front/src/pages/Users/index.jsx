import React, { useState, useCallback, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import validator from "validator";

import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import Sidebar from "../../components/Sidebar";
import {
  DeleteButton,
  Main,
  Table,
  TableActions,
  Tables,
  Title,
  FormBox,
  FormRow,
  SettingGroup,
  ContentInner,
  NewTitle,
} from "./users";

import { Content } from "../../utils/stylesbase";
import { API_URL } from "../../utils/env";

const Users = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const permissions = [
    "Escritório",
    "Financeiro",
    "Equipe",
    "SuperAdmin",
    "Visualização",
    "Relatórios",
  ];

  const [users, setUsers] = useState([]);
  const [formsStatus, setFormsStatus] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    permissions: "",
    authorizing: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const { sidebarClosed, userPermissions } = useContext(StoreContext);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if ([5].indexOf(userPermissions) !== -1) return;

      if (errorMessage !== "") return;

      fetch(`${API_URL}users/create.php`, {
        method: "POST",
        body: JSON.stringify({
          ...formData,
        }),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Usuário criado corretamente</i>,
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
    [errorMessage, userPermissions]
  );

  const onChange = useCallback(
    (e) => {
      let newFormData = formData;
      newFormData[e.target.name] = e.target.value;
      setFormData(newFormData);
      setFormsStatus(Math.random());
      if (e.target.name === "password") validate(e.target.value);
    },
    [formData]
  );

  const deleteUser = useCallback(
    (userId) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: "Tem certeza que deseja excluir o usuário?",
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}users/delete.php?id=${userId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Usuário excluído com sucesso!", "", "success").then(
                () => {
                  return navigate(0);
                }
              )
            );
        }
      });
    },
    [userPermissions]
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
    fetch(`${API_URL}users/list-all.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let formatedResponse = response;
        formatedResponse.forEach((user) => {
          user.permissions = permissions[parseInt(user.permissions) - 1];
        });
        setUsers(formatedResponse);
      });
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <Title>Usuários</Title>
        <ContentInner>
          <SettingGroup>
            <Tables>
              <Table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    return (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.name}</td>
                        <td>{user.permissions}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <TableActions>
                <thead>
                  <tr></tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    return (
                      <tr key={user.id}>
                        <td>
                          <DeleteButton onClick={() => deleteUser(user.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableActions>
            </Tables>
            <NewTitle>Novo usuário</NewTitle>
            <FormBox
              component="form"
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
              name="new-user"
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
                  required
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
                <FormControl fullWidth>
                  <InputLabel id="permissions-label">Permissões</InputLabel>
                  <Select
                    labelId="permissions-label"
                    id="permissions"
                    label="Permissions"
                    name="permissions"
                    onChange={onChange}
                    value={formData.permissions}
                    required
                  >
                    {permissions.map((permission, index) => {
                      return (
                        <MenuItem value={index + 1} key={permission}>
                          {permission}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </FormRow>
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

export default Users;
