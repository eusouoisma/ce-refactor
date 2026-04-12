import styled from 'styled-components';
import DeleteTwoToneIcon from "@mui/icons-material/DeleteTwoTone";
import TuneTwoToneIcon from "@mui/icons-material/TuneTwoTone";

export const Container = styled.div`
    background: #fcfcfc;
    position: relative;
    width: 100%;
    display: flex;
    min-height: 100vh;
`;

export const Title = styled.span`
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 20px;
    display: block;
`;

export const SearchContainer = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
`;

export const SearchBox = styled.div`
    width: 300px;
`;

export const Table = styled.table`
    overflow-x: scroll;
    white-space: nowrap;
    display: table-caption;
    text-align: center;
    border-spacing: 0;
    border-radius: 5px;
    border: solid 1px #ccc;
    max-height: 65vh;

    thead {
        background: #e6e6e6;
        height: 50px;
    }

    thead th {
        border-bottom: solid 1px #ccc;
        cursor: pointer;
        position: sticky;
        background: #00cbff;
        top: 0px;
        z-index: 999;
    }

    thead th.active {
        background: #f4f46a;
    }

    tr {
        height: 35px;
        &.selected {
            td {
                background: #e4f681;
            }
        }
    }

    tr:not(:last-child) td {
        border-bottom: solid 1px #ccc;
    }

    th {
        padding: 5px 5px;
    }

    td {
        padding: 0 5px;
        position: relative;
    }

    td:nth-child(2n + 1) {
        background: #00cbff;
    }

    tr.fulfilled {
        background: #bcf1bf;
        td:nth-child(2n + 1) {
            background: #bcf1bf;
        }
    }

    tbody {
        display: ${(props) =>
            props.loading === "true" ? "none" : "table-row-group"};
    }
`;

export const DeleteButton = styled(DeleteTwoToneIcon)`
    padding: 5px;
    border-radius: 10px;
    cursor: pointer;
    background: #d55b5b;
`;

export const EditButton = styled(TuneTwoToneIcon)`
    padding: 5px;
    border-radius: 10px;
    cursor: pointer;
    background: #f4f46a;
`; 