import React, { useState, useCallback, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import {
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

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
} from "./comissionupdate";

import { useNavigate } from "react-router-dom";
import { API_URL } from "../../utils/env";

const ComissionUpdate = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const comissionId = params.get("id");

  const [currencies, setCurrencies] = useState([]);

  const [formData, setFormData] = useState({
    orderRef: "",
    comissionersName: "",
    comissionersContact: "",
    comissionCurrency: "",
    comissionPrice: "",
    comissionPaid: false,
  });
  const [formsStatus, setFormsStatus] = useState({});

  const { userName, userPermissions } = useContext(StoreContext);

  const onchange = useCallback(
    (e) => {
      let newFormData = formData;
      newFormData[e.target.name] =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setFormData(newFormData);
      setFormsStatus(Math.random());
    },
    [formData]
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = {
        ...formData,
        lastEditBy: userName,
      };

      fetch(`${API_URL}comissions/update.php?id=${formData.id}`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Comissão atualizada</i>,
              icon: "success",
            }).then(() => {
              return navigate("/listar-comissoes");
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Algo deu errado!",
            });
          }
        })
        .catch(() => {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Algo deu errado!",
          });
        });
    },
    [formData, userPermissions]
  );

  useEffect(() => {
    if (!comissionId) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Comissão não encontrada!",
      }).then(() => {
        navigate("/listar-comissoes");
      });
    } else {
      fetch(`${API_URL}comissions/list-by-id.php?comission_id=${comissionId}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          let formatedData = response;
          formatedData.comissionPaid =
            response.comissionPaid === "1" ? true : false;
          setFormData(formatedData);
        });
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}settings/currencies.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setCurrencies(transformedData);
      });
  }, []);

  return (
    <Main>
      <Sidebar></Sidebar>
      <Content>
        <SubTitle>Comissão</SubTitle>
        <Title>Atualizar</Title>
        <FormBox
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
          status={formsStatus}
        >
          <FormRow>
            <TextField
              id="comissionersName"
              label="Nome do Comissionado"
              variant="outlined"
              name="comissionersName"
              onChange={onchange}
              value={formData.comissionersName}
            />
            <TextField
              id="comissionersContact"
              label="Contato do Comissionado"
              variant="outlined"
              name="comissionersContact"
              onChange={onchange}
              value={formData.comissionersContact}
            />
          </FormRow>
          <FormRow>
            <FormControl fullWidth>
              <InputLabel id="comission-currency-label">Currency</InputLabel>
              <Select
                labelId="comission-currency-label"
                id="comissionCurrency"
                label="Moeda"
                name="comissionCurrency"
                onChange={onchange}
                value={formData.comissionCurrency}
              >
                {currencies.map((currency) => {
                  return (
                    <MenuItem value={currency} key={currency}>
                      {currency}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField
              id="comissionPrice"
              label="Valor da Comissão"
              variant="outlined"
              name="comissionPrice"
              onChange={onchange}
              value={formData.comissionPrice}
            />
          </FormRow>
          <FormRow>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    id="comissionPaid"
                    name="comissionPaid"
                    onChange={onchange}
                    checked={formData.comissionPaid}
                  />
                }
                label="Pago?"
              />
            </FormGroup>
          </FormRow>
          <Button variant="outlined" type="submit">
            Salvar
          </Button>
        </FormBox>
      </Content>
    </Main>
  );
};

export default ComissionUpdate;
