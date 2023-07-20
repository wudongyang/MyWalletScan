import {Menu} from 'antd';
import {useEffect, useState} from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {GithubOutlined, TwitterOutlined} from "@ant-design/icons";
import './index.css'
import {getEthPrice, getGasPrice} from "@utils";

const GasPrice = () => {
    const [gasPrice, setGasPrice] = useState(null);
    useEffect(() => {
        const fetchPrice = async () => {
            const price = await getGasPrice();
            setGasPrice(price);
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, 10000);
        return () => clearInterval(interval);
    }, []);
    if (gasPrice === null) {
        return <div>Loading ETH Price...</div>;
    }
    return <div>ETH Price: ${gasPrice}</div>
}

const EthPrice = () => {
    const [ethPrice, setEthPrice] = useState(null);
    useEffect(() => {
        const fetchPrice = async () => {
            const price = await getEthPrice();
            setEthPrice(price);
        };
        fetchPrice();
        const interval = setInterval(fetchPrice, 10000);
        return () => clearInterval(interval);
    }, []);
    if (ethPrice === null) {
        return <div>Loading ETH Price...</div>;
    }
    return <div>ETH Price: ${ethPrice}</div>
}
const MenuHeader = () => {
    const items = [
        {
            label: 'zkSync',
            key: 'zksync',
        },
        {
            label: 'zkSyncTasks',
            key: 'zksyncTasks',
        },
        {
            label: 'zkRank',
            key: 'zkRank',
        },
        {
            label: 'Stark',
            key: 'stark',
        },
        {
            label: 'StarkTasks',
            key: 'starkTasks',
        },
        {
            label: 'LayerZero',
            key: 'layer',
        },
        {
            label: 'Mirror',
            key: 'mirror',
        },
        {
            label: 'Deposit',
            key: 'deposit',
        },
        // {
        //     label: 'Coffee',
        //     key: 'coffee',
        // },
        {
            label: <a href="https://github.com/luoyeETH/MyWalletScan" target="_blank"
                      rel="noopener noreferrer"><GithubOutlined/></a>,
            key: 'github',
        },
        // {
        //     label: <a href="https://twitter.com/jingluo0" target="_blank"
        //               rel="noopener noreferrer"><TwitterOutlined/></a>,
        //     key: 'twitter',
        // },
        {
            label: <EthPrice/>,
            key: 'ethPrice',
        },
        {
            label: <GasPrice/>,
            key: 'gasPrice',
        }
    ];
    const navigate = useNavigate();
    const location = useLocation();
    const [current, setCurrent] = useState(location.pathname.replace('/', '') || 'zksync');
    const onClick = (e) => {
        setCurrent(e.key);
    };
    useEffect(() => {
        if (location.pathname.replace('/', '') === 'twitter' || location.pathname.replace('/', '') === 'github') {
            return;
        }
        setCurrent(location.pathname.replace('/', '') || 'zksync');
    }, [location.pathname]);

    useEffect(() => {
        if (current === 'twitter' || current === 'github') {
            return;
        }
        navigate(`/${current}`);
    }, [current]);

    return (
        <Menu
            onClick={onClick}
            selectedKeys={[current]}
            mode="horizontal"
            style={{
                display: 'flex',
                justifyContent: 'center'
            }}
            className="custom-menu"
            items={items}
        >
        </Menu>
    );

};
export default MenuHeader;
