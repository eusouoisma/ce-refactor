import React, { useState, useCallback, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

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
} from "./productupdate";

import { useNavigate } from "react-router-dom";
import { API_URL } from "../../utils/env";

const ProductUpdate = () => {
  const MySwal = withReactContent(Swal);
  const navigate = useNavigate();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const productId = params.get("id");

  const [formData, setFormData] = useState({
    type: "regular",
    category: "atividade",
    productName: "",
    duration: "",
    variants: [
      {
        pricingType: "person",
        priceAdult: 0,
        priceHalf: 0,
        priceNet: 0,
        priceBrazilian: 0,
        priceGroup: 0,
        paxLimit: 0,
        priceAdultHighSeason: 0,
        priceHalfHighSeason: 0,
        priceNetHighSeason: 0,
        priceBrazilianHighSeason: 0,
        priceGroupHighSeason: 0,
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
    newFormData.variants[index][e.target.name] = e.target.value;
    setFormData(newFormData);
    setFormsStatus(Math.random());
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if ([5].indexOf(userPermissions) !== -1) return;

      let body = formData;
      body.lastEditBy = userName;
      body.productId = productId;

      fetch(`${API_URL}products/update.php`, {
        method: "POST",
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((response) => {
          if (!response.error) {
            MySwal.fire({
              title: <p>Sucesso</p>,
              html: <i>Produto atualizado com sucesso</i>,
              icon: "success",
            }).then(() => {
              return e.nativeEvent.submitter.getAttribute("create-new")
                ? navigate(0)
                : navigate("/listar-produtos");
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
    [formData, userName, productId, userPermissions]
  );

  const newVariant = useCallback(() => {
    formData.variants.push({
      pricingType: "person",
      priceAdult: 0,
      priceHalf: 0,
      priceNet: 0,
      priceBrazilian: 0,
      priceGroup: 0,
      paxLimit: 0,
      priceAdultHighSeason: 0,
      priceHalfHighSeason: 0,
      priceNetHighSeason: 0,
      priceBrazilianHighSeason: 0,
      priceGroupHighSeason: 0,
    });
    setFormsStatus(Math.random());
  }, [formData]);

  useEffect(() => {
    if (!productId) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Produto não encontrada!",
      }).then(() => {
        navigate("/listar-produtos");
      });
    } else {
      fetch(`${API_URL}products/list-by-id.php?product_id=${productId}`, {
        method: "GET",
      })
        .then((response) => response.json())
        .then((response) => {
          let newFormData = formData;
          newFormData.variants = [];
          response.map((product, index) => {
            if (index === 0) {
              newFormData.type = product.type;
              newFormData.category = product.category || "atividade";
              newFormData.productName = product.name;
              newFormData.duration = product.duration;
            }
            newFormData.variants.push({
              pricingType: product.pricingType,
              priceAdult: product.priceAdult,
              priceHalf: product.priceHalf,
              priceNet: product.priceNet,
              priceBrazilian: product.priceBrazilian,
              priceGroup: product.priceGroup,
              paxLimit: product.paxLimit,
              priceAdultHighSeason: product.priceAdultHighSeason || 0,
              priceHalfHighSeason: product.priceHalfHighSeason || 0,
              priceNetHighSeason: product.priceNetHighSeason || 0,
              priceBrazilianHighSeason: product.priceBrazilianHighSeason || 0,
              priceGroupHighSeason: product.priceGroupHighSeason || 0,
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
        <SubTitle>Produto</SubTitle>
        <Title>Cadastrar</Title>
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
            <FormControl fullWidth>
              <InputLabel id="category-label">Categoria</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                label="Categoria"
                value={formData.category}
                onChange={onchange}
              >
                <MenuItem value="atividade">Atividade</MenuItem>
                <MenuItem value="adicional">Adicional</MenuItem>
              </Select>
            </FormControl>
            <TextField
              id="productName"
              label="Nome do Produto"
              variant="outlined"
              name="productName"
              onChange={onchange}
              value={formData.productName}
            />
            <TextField
              id="duration"
              label="Duração"
              variant="outlined"
              name="duration"
              onChange={onchange}
              value={formData.duration}
            />
          </FormRow>
          {formData.type === "show/evento" ? (
            <>
              <FormRow>
                <TextField
                  id="priceAdult"
                  label="Preço (R$)"
                  variant="outlined"
                  name="priceAdult"
                  onChange={(e) => onChangeVariant(e, 0)}
                  value={formData.variants[0].priceAdult}
                  type="number"
                />
                <div></div>
                <div></div>
              </FormRow>
              <VariantsTitle style={{ marginTop: '20px', color: '#000000', fontSize: '16px' }}>Preço de Alta Temporada</VariantsTitle>
              <FormRow>
                <TextField
                  id="priceAdultHighSeason"
                  label="Preço Alta Temporada (R$)"
                  variant="outlined"
                  name="priceAdultHighSeason"
                  onChange={(e) => onChangeVariant(e, 0)}
                  value={formData.variants[0].priceAdultHighSeason}
                  type="number"
                />
                <div></div>
                <div></div>
              </FormRow>
            </>
          ) : (
            <>
              <VariantsTitle>Variantes</VariantsTitle>
              {formData.variants.map((variant, index) =>
                formData.type === "regular" ? (
                  <Variant key={`variant-regular-${index}`}>
                    <FormRow>
                      <FormControl fullWidth>
                        <InputLabel id="pricing-type-label">
                          Tipo de Precificação
                        </InputLabel>
                        <Select
                          labelId="pricing-type-label"
                          id="pricingType"
                          name="pricingType"
                          label="Tipo de Precificação"
                          value={variant.pricingType}
                          onChange={(e) => onChangeVariant(e, index)}
                        >
                          <MenuItem value="group">Por Grupo</MenuItem>
                          <MenuItem value="person">Por Pessoa</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        id="paxLimit"
                        label="Mínimo de Pessoas"
                        variant="outlined"
                        name="paxLimit"
                        onChange={(e) => onChangeVariant(e, index)}
                        value={variant.paxLimit}
                        type="number"
                        InputProps={{
                          readOnly: index === 0,
                        }}
                      />
                      <div></div>
                    </FormRow>

                    <VariantsTitle style={{ marginTop: '20px', color: '#000000', fontSize: '16px' }}>Preços Normais</VariantsTitle>
                    {variant.pricingType === "person" ? (
                      <>
                        <FormRow>
                          <TextField
                            id="priceAdult"
                            label="Preço Adulto (R$)"
                            variant="outlined"
                            name="priceAdult"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceAdult}
                            type="number"
                          />
                          <TextField
                            id="priceHalf"
                            label="Preço Meia Entrada"
                            variant="outlined"
                            name="priceHalf"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceHalf}
                            type="number"
                          />
                          <TextField
                            id="priceNet"
                            label="Preço NET"
                            variant="outlined"
                            name="priceNet"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceNet}
                            type="number"
                          />
                        </FormRow>
                        <FormRow>
                          <TextField
                            id="priceBrazilian"
                            label="Preço Brasileiro"
                            variant="outlined"
                            name="priceBrazilian"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceBrazilian}
                            type="number"
                          />
                          <div></div>
                          <div></div>
                        </FormRow>
                      </>
                    ) : (
                      <FormRow>
                        <TextField
                          id="priceGroup"
                          label="Preço Grupo (R$)"
                          variant="outlined"
                          name="priceGroup"
                          onChange={(e) => onChangeVariant(e, index)}
                          value={variant.priceGroup}
                          type="number"
                        />
                        <div></div>
                        <div></div>
                      </FormRow>
                    )}

                    <VariantsTitle style={{ marginTop: '20px', color: '#000000', fontSize: '16px' }}>Preços de Alta Temporada</VariantsTitle>
                    {variant.pricingType === "person" ? (
                      <>
                        <FormRow>
                          <TextField
                            id="priceAdultHighSeason"
                            label="Preço Adulto Alta Temporada"
                            variant="outlined"
                            name="priceAdultHighSeason"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceAdultHighSeason}
                            type="number"
                          />
                          <TextField
                            id="priceHalfHighSeason"
                            label="Preço Meia Alta Temporada"
                            variant="outlined"
                            name="priceHalfHighSeason"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceHalfHighSeason}
                            type="number"
                          />
                          <TextField
                            id="priceNetHighSeason"
                            label="Preço NET Alta Temporada"
                            variant="outlined"
                            name="priceNetHighSeason"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceNetHighSeason}
                            type="number"
                          />
                        </FormRow>
                        <FormRow>
                          <TextField
                            id="priceBrazilianHighSeason"
                            label="Preço Brasileiro Alta Temporada"
                            variant="outlined"
                            name="priceBrazilianHighSeason"
                            onChange={(e) => onChangeVariant(e, index)}
                            value={variant.priceBrazilianHighSeason}
                            type="number"
                          />
                          <div></div>
                          <div></div>
                        </FormRow>
                      </>
                    ) : (
                      <FormRow>
                        <TextField
                          id="priceGroupHighSeason"
                          label="Preço Grupo Alta Temporada"
                          variant="outlined"
                          name="priceGroupHighSeason"
                          onChange={(e) => onChangeVariant(e, index)}
                          value={variant.priceGroupHighSeason}
                          type="number"
                        />
                        <div></div>
                        <div></div>
                      </FormRow>
                    )}
                  </Variant>
                ) : (
                  <Variant key={`variant-privativo-${index}`}>
                    <FormRow>
                      <FormControl fullWidth>
                        <InputLabel id="pricing-type-label">
                          Tipo de Precificação
                        </InputLabel>
                        <Select
                          labelId="pricing-type-label"
                          id="pricingType"
                          name="pricingType"
                          label="Tipo de Precificação"
                          value={variant.pricingType}
                          onChange={(e) => onChangeVariant(e, index)}
                        >
                          <MenuItem value="group">Por Grupo</MenuItem>
                          <MenuItem value="person">Por Pessoa</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        id="paxLimit"
                        label="Mínimo de Pessoas"
                        variant="outlined"
                        name="paxLimit"
                        onChange={(e) => onChangeVariant(e, index)}
                        value={variant.paxLimit}
                        type="number"
                        InputProps={{
                          readOnly: index === 0,
                        }}
                      />
                      <div></div>
                    </FormRow>

                    <VariantsTitle style={{ marginTop: '20px', color: '#000000', fontSize: '16px' }}>Preços Normais</VariantsTitle>
                    {variant.pricingType === "person" ? (
                      <TextField
                        id="priceAdult"
                        label="Preço por Pessoa (R$)"
                        variant="outlined"
                        name="priceAdult"
                        onChange={(e) => onChangeVariant(e, index)}
                        value={variant.priceAdult}
                        type="number"
                      />
                    ) : (
                      <TextField
                        id="priceGroup"
                        label="Preço Grupo (R$)"
                        variant="outlined"
                        name="priceGroup"
                        onChange={(e) => onChangeVariant(e, index)}
                        value={variant.priceGroup}
                        type="number"
                      />
                    )}

                    <VariantsTitle style={{ marginTop: '20px', color: '#000000', fontSize: '16px' }}>Preços de Alta Temporada</VariantsTitle>
                    {variant.pricingType === "person" ? (
                      <TextField
                        id="priceAdultHighSeason"
                        label="Preço por Pessoa Alta Temporada (R$)"
                        variant="outlined"
                        name="priceAdultHighSeason"
                        onChange={(e) => onChangeVariant(e, index)}
                        value={variant.priceAdultHighSeason}
                        type="number"
                      />
                    ) : (
                      <TextField
                        id="priceGroupHighSeason"
                        label="Preço Grupo Alta Temporada (R$)"
                        variant="outlined"
                        name="priceGroupHighSeason"
                        onChange={(e) => onChangeVariant(e, index)}
                        value={variant.priceGroupHighSeason}
                        type="number"
                      />
                    )}
                  </Variant>
                )
              )}
              <AddVariantIcon onClick={newVariant} />
            </>
          )}
          <FormButtons>
            <Button variant="outlined" type="submit">
              Salvar
            </Button>
            <Button variant="outlined" type="submit" create-new="true">
              Salvar e Criar Outra
            </Button>
          </FormButtons>
        </FormBox>
      </Content>
    </Main>
  );
};

export default ProductUpdate;
