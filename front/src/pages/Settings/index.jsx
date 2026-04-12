import React, { useState, useCallback, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { TextField, Button } from "@mui/material";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import Sidebar from "../../components/Sidebar";
import {
  DeleteButton,
  Main,
  SubTitle,
  Table,
  TableActions,
  Tables,
  Title,
  FormBox,
  FormRow,
  SettingGroup,
  ContentInner,
} from "./settings";

import { Content } from "../../utils/stylesbase";
import { API_URL } from "../../utils/env";

const Settings = () => {
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);

  const [settings, setSettings] = useState([]);
  const [formsStatus, setFormsStatus] = useState(0);
  const [formData, setFormData] = useState({
    platform: "",
    currentYear: "",
    language: "",
    status: "",
    paymentStatus: "",
    currency: "",
    paymentMethod: "",
    local: "",
    guide: "",
    company: "",
    accountNumber: "",
    country: "",
  });

  const { sidebarClosed, userPermissions } = useContext(StoreContext);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = {
        type: e.target[0].name,
        value: e.target[0].value,
      };

      fetch(`${API_URL}settings/create.php`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Configuração cadastrada com sucesso</i>,
              icon: "success",
            }).then(() => {
              return navigate(0);
            });
          }
        });
    },
    [userPermissions]
  );

  const deleteSetting = useCallback(
    (settingId) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: "Are you sure you want to delete the option?",
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}settings/delete.php?id=${settingId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Setting removed successfully!!", "", "success").then(
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

  const onChange = useCallback(
    (e) => {
      let newFormData = formData;
      newFormData[e.target.name] = e.target.value;
      setFormData(newFormData);
      setFormsStatus(Math.random());
    },
    [formData]
  );

  const logoutAll = useCallback(() => {
    if ([5].indexOf(userPermissions) !== -1) return;
    fetch(`${API_URL}users/logout-all.php`)
      .then((response) => response.json())
      .then((response) => {
        navigate("/login");
      });
  }, [userPermissions]);

  useEffect(() => {
    fetch(`${API_URL}settings/list-all.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        setSettings(response);
        let newFormData = formData;
        newFormData.currentYear = response.find(
          (setting) => setting.type === "currentYear"
        ).value;
        setFormData(newFormData);
      });
  }, []);

  return (
    <Main>
      <Sidebar />
      <Content sidebarclosed={sidebarClosed.toString()}>
        <Title>Configurações</Title>
        <ContentInner>
          <SettingGroup>
            <SubTitle>Plataforma</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "platform")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "platform")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newPlatform"
                  label="Nova Plataforma"
                  variant="outlined"
                  name="platform"
                  onChange={onChange}
                  value={formData.platform}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Idioma</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "language")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "language")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newLanguage"
                  label="Novo Idioma"
                  variant="outlined"
                  name="language"
                  onChange={onChange}
                  value={formData.language}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Status</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "status")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "status")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newStatus"
                  label="Novo Status"
                  variant="outlined"
                  name="status"
                  onChange={onChange}
                  value={formData.status}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Status de Pagamento</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "paymentStatus")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "paymentStatus")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newPaymentStatus"
                  label="Novo Status de Pagamento"
                  variant="outlined"
                  name="paymentStatus"
                  onChange={onChange}
                  value={formData.paymentStatus}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Forma de Pagamento</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "paymentMethod")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "paymentMethod")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newPaymentMethod"
                  label="Nova Forma de Pagamento"
                  variant="outlined"
                  name="paymentMethod"
                  onChange={onChange}
                  value={formData.paymentMethod}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Local</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "local")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "local")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newLocal"
                  label="Novo Local"
                  variant="outlined"
                  name="local"
                  onChange={onChange}
                  value={formData.local}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Guia</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "guide")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "guide")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newGuide"
                  label="Novo Guia"
                  variant="outlined"
                  name="guide"
                  onChange={onChange}
                  value={formData.guide}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Empresa</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "company")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "company")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newCompany"
                  label="Nova Empresa"
                  variant="outlined"
                  name="company"
                  onChange={onChange}
                  value={formData.company}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Número de Conta</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "accountNumber")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "accountNumber")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newAccountNumber"
                  label="Novo Número de Conta"
                  variant="outlined"
                  name="accountNumber"
                  onChange={onChange}
                  value={formData.accountNumber}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <SubTitle>Países</SubTitle>
            <Tables>
              <Table>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "country")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>{data.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </Table>
              <TableActions>
                <tbody>
                  {settings
                    .filter((setting) => setting.type === "country")
                    .map((data) => {
                      return (
                        <tr key={data.id}>
                          <td>
                            <DeleteButton
                              onClick={() => deleteSetting(data.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </TableActions>
            </Tables>
            <FormBox
              component="form"
              noValidate
              autoComplete="off"
              onSubmit={onSubmit}
              status={formsStatus}
            >
              <FormRow>
                <TextField
                  id="newCountry"
                  label="Novo País"
                  variant="outlined"
                  name="country"
                  onChange={onChange}
                  value={formData.country}
                  type="text"
                  placeholder=""
                />
                <Button variant="outlined" type="submit">
                  Salvar
                </Button>
              </FormRow>
            </FormBox>
          </SettingGroup>

          <SettingGroup>
            <Button
              variant="outlined"
              type="submit"
              onClick={() => logoutAll()}
            >
              Deslogar todos os usuários
            </Button>
          </SettingGroup>
        </ContentInner>
      </Content>
    </Main>
  );
};

export default Settings;
