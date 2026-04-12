import React, { useState, useCallback, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

import {
  TextField,
  Button,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import StoreContext from "../../components/Store/Context";

import {
  Content,
  Main,
  SubTitle,
  Title,
  FormBox,
  FormRow,
  FormButtons,
  VariantsTitle,
  Variant,
  AddVariantIcon,
} from "./customerupdate";

import { useNavigate } from "react-router-dom";
import { API_URL } from "../../utils/env";

const CustomerUpdate = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const customerId = params.get("id");

  const [formData, setFormData] = useState({
    customerName: "",
    customerType: "",
    contacts: [
      {
        name: "",
        contact: "",
        office: "",
        email: "",
      },
    ],
  });
  const [formsStatus, setFormsStatus] = useState({});

  const { userName, userPermissions } = useContext(StoreContext);

  const onchange = useCallback(
    (e) => {
      let newFormData = formData;
      newFormData[e.target.name] =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      if (e.target.name === "currency")
        newFormData.comissionCurrency = e.target.value;
      setFormData(newFormData);
      setFormsStatus(Math.random());
    },
    [formData]
  );

  const onChangeVariant = useCallback((e, index) => {
    let newFormData = formData;
    newFormData.contacts[index][e.target.name] = e.target.value;
    setFormData(newFormData);
    setFormsStatus(Math.random());
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = formData;

      body.lastEditBy = userName;
      body.customerId = customerId;

      fetch(`${API_URL}customers/update.php`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Cliente atualizado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return e.nativeEvent.submitter.getAttribute("create-new")
                ? navigate(0)
                : navigate("/listar-clientes");
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        });
    },
    [formData, userName, customerId, userPermissions]
  );

  const newVariant = useCallback(() => {
    formData.contacts.push({
      name: "",
      contact: "",
      office: "",
      email: "",
    });
    setFormsStatus(Math.random());
  }, [formData]);

  useEffect(() => {
    if (!customerId) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Comissão não encontrada!",
      }).then(() => {
        navigate("/listar-clientes");
      });
    } else {
      fetch(`${API_URL}customers/list-by-id.php?customer_id=${customerId}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          let newFormData = formData;
          newFormData.contacts = [];
          response.map((customer, index) => {
            if (index === 0) {
              newFormData.customerName = customer.customerName;
              newFormData.customerType = customer.customerType;
            }
            newFormData.contacts.push({
              name: customer.contactName,
              contact: customer.contactContact,
              office: customer.contactOffice,
              email: customer.contactEmail,
            });
            return null;
          });
          setFormData(newFormData);
          setFormsStatus(Math.random());
        });
    }
  }, []);

  return (
    <Main>
      <Sidebar></Sidebar>
      <Content>
        <SubTitle>Cliente</SubTitle>
        <Title>Editar</Title>
        <FormBox
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
          status={formsStatus}
        >
          <FormRow>
            <TextField
              id="customerName"
              label="Nome do Cliente"
              variant="outlined"
              name="customerName"
              onChange={onchange}
              value={formData.customerName}
            />
            <FormControl fullWidth>
              <InputLabel id="customer-type-label">Tipo</InputLabel>
              <Select
                labelId="customer-type-label"
                id="customer-type"
                name="customerType"
                label="Tipo"
                value={formData.customerType}
                onChange={onchange}
              >
                <MenuItem value="Agência">Agência</MenuItem>
                <MenuItem value="Guia">Guia</MenuItem>
                <MenuItem value="Cliente Final">Cliente Final</MenuItem>
              </Select>
            </FormControl>
          </FormRow>
          <VariantsTitle>Contatos</VariantsTitle>
          {formData.contacts.map((variant, index) => (
            <Variant key={`contact-${index}`}>
              <FormRow>
                <TextField
                  id={`name-${index}`}
                  label="Nome"
                  variant="outlined"
                  name="name"
                  onChange={(e) => onChangeVariant(e, index)}
                  value={variant.name}
                  type="text"
                />
                <TextField
                  id={`contact-${index}`}
                  label="Telefone"
                  variant="outlined"
                  name="contact"
                  onChange={(e) => onChangeVariant(e, index)}
                  value={variant.contact}
                  type="text"
                />
              </FormRow>
              <FormRow>
                <TextField
                  id={`office-${index}`}
                  label="Cargo"
                  variant="outlined"
                  name="office"
                  onChange={(e) => onChangeVariant(e, index)}
                  value={variant.office}
                  type="text"
                />
                <TextField
                  id={`email-${index}`}
                  label="Email"
                  variant="outlined"
                  name="email"
                  onChange={(e) => onChangeVariant(e, index)}
                  value={variant.email}
                  type="text"
                />
              </FormRow>
            </Variant>
          ))}
          <AddVariantIcon onClick={newVariant} />
          <FormButtons>
            <Button variant="outlined" type="submit">
              Salvar
            </Button>
          </FormButtons>
        </FormBox>
      </Content>
    </Main>
  );
};

export default CustomerUpdate;
