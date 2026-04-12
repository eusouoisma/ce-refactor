import React, { useState, useCallback, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { forwardRef } from "react";
import { NumericFormat } from "react-number-format";

import Sidebar from "../../components/Sidebar";

import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material";

import Textarea from "@mui/joy/Textarea";

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
  Table,
  ComissionModal,
  ComissionModalHeader,
  ComissionModalTitle,
  ComissionModalClose,
} from "./financialtourupdate";

import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/functions";
import { API_URL } from "../../utils/env";

const getMonth = (date) => {
  var month = date.getMonth() + 1;
  return month < 10 ? "0" + month : "" + month;
};

const getDay = (date) => {
  var day = date.getDate();
  return day < 10 ? "0" + day : "" + day;
};

const curDate = new Date();
const formatedCurDate = `${curDate.getFullYear()}-${getMonth(curDate)}-${getDay(
  curDate
)}`;

const MoneyInput = forwardRef((props, ref) => {
  const { onChange, ...other } = props;
  return (
    <NumericFormat
      {...other}
      onValueChange={(values) => {
        onChange({
          target: { name: other.name, value: values.value },
        });
      }}
      getInputRef={ref}
      value={other.value}
      allowLeadingZeros={false}
      allowNegative={false}
      decimalScale={2}
      fixedDecimalScale={true}
      decimalSeparator=","
      allowedDecimalSeparators={["."]}
      thousandSeparator="."
      isAllowed={(values) => {
        if (values.value.length > 9) return false;
        return true;
      }}
    />
  );
});

const FinancialTourUpdate = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const tourId = params.get("id");

  const { userName, userPermissions } = useContext(StoreContext);

  const [formData, setFormData] = useState({
    type: "",
    company: "",
    invoiceNumber: "",
    status: "",
    paymentStatus: "",
    accountNumber: "",
    paymentDate: "",
    tourDate: "",
    tourHour: "",
    activity: "",
    adicional: "",
    isHighSeason: false,
    client: "",
    platform: "",
    clientName: "",
    clientContact: "",
    orderRef: "",
    paymentMethod: "",
    currency: "R$",
    totalValue: "",
    netValue: "",
    financialComments: "",
    commissioned: false,
    comissionersName: "",
    comissionersContact: "",
    comissionCurrency: "",
    comissionPrice: "",
    comissionPaid: false,
    comissionByPercentage: false,
    comissionPercentage: 0,
  });
  const [formsStatus, setFormsStatus] = useState({});
  const [platforms, setPlatforms] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activities, setActivities] = useState([]);
  const [adicionais, setAdicionais] = useState([]);
  const [selectedAdditional, setSelectedAdditional] = useState(null);
  const [status, setStatus] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [accountNumbers, setAccountNumbers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [comissionModalOpened, setComissionModalOpened] = useState(false);

  const onchange = useCallback(
    async (e) => {
      if (e.target.type === "number" && e.target.value < 0) return;
      else if (e.target.name === "commissioned") {
        let newFormData = formData;

        if (e.target.checked === false) {
          await Swal.fire({
            title:
              "Tem certeza que deseja remover a comissão referente a esse pedido?",
            showCancelButton: true,
            confirmButtonText: "Sim",
          }).then((result) => {
            if (result.isConfirmed) {
              newFormData.commissioned = false;
            } else {
              newFormData.commissioned = true;
              setComissionModalOpened(true);
            }
          });
        } else {
          newFormData.commissioned = true;
          setComissionModalOpened(true);
        }
        setFormData(newFormData);
        setFormsStatus(Math.random());
        return;
      }

      let newFormData = formData;
      if (e.target.name === "adicional") {
        setSelectedAdditional(adicionais.find((a) => a.name === e.target.value) || null);
      }
      newFormData[e.target.name] =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

      changeComissionPrice();
      setFormData(newFormData);
      setFormsStatus(Math.random());
    },
    [formData, activities, adicionais]
  );

  const changeComissionPrice = useCallback(
    (e) => {
      if (formData.comissionByPercentage) {
        const price = (
          0.01 *
          parseFloat(formData.comissionPercentage) *
          parseFloat(formData.totalValue)
        ).toFixed(2);

        let newFormData = formData;
        newFormData.comissionPrice = price;
        setFormData(newFormData);
        setFormsStatus(Math.random());
      }
    },
    [formsStatus, formData]
  );

  const deleteComission = useCallback(
    (commissionId, orderRef) => {
      if ([5].indexOf(userPermissions) !== -1) return;
      MySwal.fire({
        title: `Tem certeza que deseja remover a comissão relacionada ao pedido ${orderRef}?`,
        showCancelButton: true,
        confirmButtonText: "Yes",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`${API_URL}comissions/delete.php?id=${commissionId}`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((response) =>
              Swal.fire("Comissão removida com sucesso!!", "", "success").then(
                () => {
                  let newFormData = formData;
                  formData.commissioned = false;
                  formData.comissionByPercentage = false;
                  formData.comissionCurrency = "";
                  formData.comissionPaid = false;
                  formData.comissionersContact = "";
                  formData.comissionersName = "";
                  formData.comissionPrice = "";
                  setFormData(newFormData);
                  setFormsStatus(Math.random());
                }
              )
            );
        }
      });
    },
    [formData, userPermissions]
  );

  const onchangeChangeRequest = useCallback(
    (e) => {
      const requestId = e.target.name.replace("request-", "");
      let newChangeRequests = changeRequests;
      let request = newChangeRequests.find(
        (request) => request.id === requestId
      );
      if (e.target.id.includes("approve")) {
        request.approve = e.target.checked;
        if (e.target.checked && request.reprove) request.reprove = false;
      } else {
        request.reprove = e.target.checked;
        if (e.target.checked && request.approve) request.approve = false;
      }

      setFormsStatus(Math.random());
    },
    [changeRequests]
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = formData;
      body.changeRequests = changeRequests;
      body.lastEditBy = userName;

      fetch(`${API_URL}tours/update-financial.php?id=${formData.id}`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Tour atualizado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return e.nativeEvent.submitter.getAttribute("create-new")
                ? navigate(0)
                : navigate("/listar-tours-financeiro");
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
    [formData, changeRequests, userName, userPermissions]
  );
  useEffect(() => {
    fetch(`${API_URL}products/list-all.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        let currentProductId = null;
        response.forEach((product) => {
          if (product.productId === currentProductId) {
            transformedData
              .find((p) => p.productId === currentProductId)
              .variants.push({
                pricingType: product.pricingType,
                priceAdult: product.priceAdult,
                priceHalf: product.priceHalf,
                priceNet: product.priceNet,
                priceFree: product.priceFree,
                priceGroup: product.priceGroup,
                paxLimit: product.paxLimit,
              });
          } else {
            transformedData.push({
              productId: product.productId,
              name: product.name,
              type: product.type,
              category: product.category,
              variants: [
                {
                  pricingType: product.pricingType,
                  priceAdult: product.priceAdult,
                  priceHalf: product.priceHalf,
                  priceNet: product.priceNet,
                  priceFree: product.priceFree,
                  priceGroup: product.priceGroup,
                  paxLimit: product.paxLimit,
                },
              ],
            });
            currentProductId = product.productId;
          }
        });
        setActivities(transformedData.filter((p) => p.category !== "adicional"));
        setAdicionais(transformedData.filter((p) => p.category === "adicional"));
      });

    fetch(`${API_URL}settings/status.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setStatus(transformedData);
      });
    fetch(`${API_URL}settings/currencies.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setCurrencies(transformedData);
      });
    fetch(`${API_URL}settings/payment-methods.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPaymentMethods(transformedData);
      });

    fetch(`${API_URL}settings/payment-status.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPaymentStatus(transformedData);
      });

    fetch(`${API_URL}settings/companies.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setCompanies(transformedData);
      });

    fetch(`${API_URL}settings/account-numbers.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setAccountNumbers(transformedData);
      });

    fetch(`${API_URL}settings/platforms.php`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        let transformedData = [];
        response.forEach((data) => transformedData.push(data.value));
        setPlatforms(transformedData);
      });
  }, []);

  useEffect(() => {
    if (!tourId) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Tour não encontrado!",
      }).then(() => {
        navigate("/listar-tours-financeiro");
      });
    } else {
      fetch(`${API_URL}tours/list-by-id.php?tour_id=${tourId}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          let transformedData = response;
          transformedData.commissioned =
            transformedData.commissioned === "1" ? true : false;
          transformedData.comissionPaid =
            transformedData.comissionPaid === "1" ? true : false;
          transformedData.comissionCurrency = transformedData.comissionCurrency
            ? transformedData.comissionCurrency.trim()
            : "";
          transformedData.comissionByPercentage = false;
          transformedData.comissionPercentage = 0;
          transformedData.isHighSeason = transformedData.isHighSeason === "1" ? true : false;
          if (!transformedData.adicional) transformedData.adicional = "";

          setFormData(transformedData);
        });
      fetch(`${API_URL}changeRequests/get-by-tour-id.php?tour_id=${tourId}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          setChangeRequests(response);
        });
    }
  }, []);

  return (
    <Main>
      <Sidebar></Sidebar>
      <Content>
        <SubTitle>Tour - Financeiro</SubTitle>
        <Title>Editar</Title>
        <FormBox
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={onSubmit}
          status={formsStatus}
        >
          <FormRow>
            <FormControl fullWidth>
              <InputLabel id="tour-type-label">Tipo</InputLabel>
              <Select
                labelId="tour-type-label"
                id="tour-type"
                name="type"
                label="Tipo"
                value={formData.type}
                onChange={onchange}
              >
                <MenuItem value="regular">Regular</MenuItem>
                <MenuItem value="privativo">Privativo</MenuItem>
                <MenuItem value="show/evento">Show/Evento</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              id="company"
              freeSolo
              options={companies.map((company) => company)}
              name="company"
              value={formData.company}
              onChange={(event, newValue) => {
                onchange({
                  target: { name: "company", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="company"
                  onChange={onchange}
                  label="Empresa"
                />
              )}
            />
          </FormRow>
          <FormRow>
            {" "}
            <TextField
              id="invoiceNumber"
              label="Nº da NF"
              variant="outlined"
              name="invoiceNumber"
              onChange={onchange}
              value={formData.invoiceNumber}
              type="number"
            />
            <Autocomplete
              id="status"
              freeSolo
              options={status.map((status) => status)}
              name="status"
              value={formData.status}
              onChange={(event, newValue) => {
                onchange({ target: { name: "status", value: newValue } });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="platform"
                  onChange={onchange}
                  label="Status Reserva"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <Autocomplete
              id="paymentStatus"
              freeSolo
              options={paymentStatus.map((paymentStatus) => paymentStatus)}
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={(e, newValue) => {
                onchange({
                  target: { name: "paymentStatus", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="paymentStatus"
                  onChange={onchange}
                  label="Status de Pagamento"
                />
              )}
            />
            <Autocomplete
              id="accountNumber"
              freeSolo
              options={accountNumbers.map((accountNumber) => accountNumber)}
              name="accountNumber"
              value={formData.accountNumber}
              onChange={(event, newValue) => {
                onchange({
                  target: { name: "accountNumber", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="accountNumber"
                  onChange={onchange}
                  label="Número de Conta"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="paymentDate"
              label="Data de Pagamento"
              variant="outlined"
              name="paymentDate"
              onChange={onchange}
              value={formData.paymentDate}
              type="date"
            />
            <TextField
              id="tour-date"
              label="Data do tour"
              variant="outlined"
              name="tourDate"
              onChange={onchange}
              value={formData.tourDate}
              type="date"
              inputProps={{ min: formatedCurDate }}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="tour-Hour"
              label="Hora do Tour"
              variant="outlined"
              name="tourHour"
              onChange={onchange}
              value={formData.tourHour}
              type="time"
            />
            <Autocomplete
              id="activity"
              freeSolo
              options={activities
                .filter((activity) => activity.type === formData.type)
                .map((activity) => activity.name)}
              name="activity"
              value={formData.activity}
              onChange={(e, newValue) => {
                onchange({
                  target: { name: "activity", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="activity"
                  onChange={onchange}
                  label="Atividade"
                />
              )}
            />
            <Autocomplete
              id="adicional"
              freeSolo
              options={adicionais.map((a) => a.name)}
              name="adicional"
              value={formData.adicional}
              onChange={(e, newValue) => {
                onchange({
                  target: { name: "adicional", value: newValue || "" },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="adicional"
                  onChange={onchange}
                  label="Adicional"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="client"
              label="Cliente"
              variant="outlined"
              name="client"
              onChange={onchange}
              value={formData.client}
            />
            <Autocomplete
              id="platform"
              freeSolo
              options={platforms.map((platform) => platform)}
              name="platform"
              value={formData.platform}
              onChange={(event, newValue) => {
                onchange({ target: { name: "platform", value: newValue } });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="platform"
                  onChange={onchange}
                  label="Plataforma"
                />
              )}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="order-ref"
              label="Nº da Reserva"
              variant="outlined"
              name="orderRef"
              onChange={onchange}
              value={formData.orderRef}
            />
            <Autocomplete
              id="paymentMethod"
              freeSolo
              options={paymentMethods.map((paymentMethod) => paymentMethod)}
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={(event, newValue) => {
                onchange({
                  target: { name: "paymentMethod", value: newValue },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="paymentMethod"
                  onChange={onchange}
                  label="Método de Pagamento"
                />
              )}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isHighSeason}
                  onChange={onchange}
                  name="isHighSeason"
                />
              }
              label="Alta Temporada"
            />
          </FormRow>
          <FormRow>
            {" "}
            <Autocomplete
              id="currency"
              freeSolo
              options={currencies.map((currency) => currency)}
              name="currency"
              value={formData.currency}
              onChange={(event, newValue) => {
                onchange({ target: { name: "currency", value: newValue } });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="currency"
                  onChange={onchange}
                  label="Moeda"
                />
              )}
            />
            <TextField
              id="totalValue"
              label="Valor Total"
              variant="outlined"
              name="totalValue"
              onChange={onchange}
              value={formData.totalValue}
              InputProps={{
                inputComponent: MoneyInput,
              }}
              inputProps={{
                prefix: `${formData.currency} `,
              }}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="netValue"
              label="Valor NET"
              variant="outlined"
              name="netValue"
              onChange={onchange}
              value={formData.netValue}
              InputProps={{
                inputComponent: MoneyInput,
              }}
              inputProps={{
                prefix: `${formData.currency} `,
              }}
            />
            <TextField
              id="clientName"
              label="Nome do Cliente"
              variant="outlined"
              name="clientName"
              onChange={onchange}
              value={formData.clientName}
            />
          </FormRow>
          <FormRow>
            <TextField
              id="clientContact"
              label="Contato do Cliente"
              variant="outlined"
              name="clientContact"
              onChange={onchange}
              value={formData.clientContact}
            />
            <div>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="commissioned"
                      name="commissioned"
                      onChange={onchange}
                      checked={formData.commissioned}
                    />
                  }
                  label="Comissionado"
                />
              </FormGroup>
              {formData.commissioned && (
                <div>
                  <Button
                    variant="outlined"
                    style={{ marginRight: 20 }}
                    onClick={() => setComissionModalOpened(true)}
                  >
                    Editar Comissão
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      deleteComission(formData.commissionId, formData.orderRef)
                    }
                  >
                    Remover Comissão
                  </Button>
                </div>
              )}
            </div>
          </FormRow>
          <FormRow>
            <FormControl>
              <FormLabel>Observações Escritório</FormLabel>
              <Textarea
                minRows={4}
                placeholder="Observações Escritório"
                id="comments"
                name="comments"
                onChange={onchange}
                value={formData.comments}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Observações Financeiro</FormLabel>
              <Textarea
                minRows={4}
                placeholder="Observações Financeiro"
                id="financialComments"
                name="financialComments"
                onChange={onchange}
                value={formData.financialComments}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Histórico da Conversa</FormLabel>
              <Textarea
                minRows={4}
                placeholder="Histórico da Conversa"
                id="conversationHistory"
                name="conversationHistory"
                onChange={onchange}
                value={formData.conversationHistory}
              />
            </FormControl>
          </FormRow>
          {changeRequests.length > 0 && (
            <>
              <Title nomargin="true">Alterações aguardando aprovação</Title>
              <Table>
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Valor Antigo</th>
                    <th>Novo Valor</th>
                    <th>Requisitado por</th>
                    <th>Aprovar?</th>
                    <th>Reprovar?</th>
                  </tr>
                </thead>
                <tbody>
                  {changeRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.name}</td>
                      <td>
                        {request.name === "Valor Total"
                          ? formatMoney(request.oldValue)
                          : request.oldValue}
                      </td>
                      <td>
                        {request.name === "Valor Total"
                          ? formatMoney(request.newValue)
                          : request.newValue}
                      </td>
                      <td>{request.createdBy}</td>
                      <td>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                id={`approve-request-${request.id}`}
                                name={`request-${request.id}`}
                                onChange={onchangeChangeRequest}
                                checked={request.approve || false}
                              />
                            }
                          />
                        </FormGroup>
                      </td>
                      <td>
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                id={`reprove-request-${request.id}`}
                                name={`request-${request.id}`}
                                onChange={onchangeChangeRequest}
                                checked={request.reprove || false}
                              />
                            }
                          />
                        </FormGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
          <FormButtons>
            <Button variant="outlined" type="submit">
              Salvar
            </Button>
          </FormButtons>
        </FormBox>
        <ComissionModal opened={comissionModalOpened.toString()}>
          <ComissionModalHeader>
            <ComissionModalTitle>Comissão</ComissionModalTitle>
            <ComissionModalClose
              onClick={() => setComissionModalOpened(false)}
            />
          </ComissionModalHeader>
          <FormBox
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
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
                <InputLabel id="comission-currency-label">Moeda</InputLabel>
                <Select
                  labelId="comission-currency-label"
                  id="comissionCurrency"
                  label="Comission Currency"
                  name="comissionCurrency"
                  onChange={onchange}
                  value={formData.comissionCurrency || ""}
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
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="comissionByPercentage"
                      name="comissionByPercentage"
                      onChange={onchange}
                      checked={formData.comissionByPercentage}
                    />
                  }
                  label="Calcular por porcentagem?"
                />
              </FormGroup>
              <TextField
                id="comissionPercentage"
                label="Percentual de  comissão"
                variant="outlined"
                name="comissionPercentage"
                onChange={onchange}
                value={formData.comissionPercentage}
                type="number"
                max="100"
                style={{
                  display: formData.comissionByPercentage ? "block" : "none",
                }}
              />
            </FormRow>
            <Button
              onClick={() => setComissionModalOpened(false)}
              variant="outlined"
            >
              OK
            </Button>
          </FormBox>
        </ComissionModal>
      </Content>
    </Main>
  );
};

export default FinancialTourUpdate;
