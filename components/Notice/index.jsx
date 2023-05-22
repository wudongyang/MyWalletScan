import {Modal} from "antd";
import {useEffect, useState} from "react";

const Notice = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    useEffect(() => {
        setModalIsOpen(true);
    }, []);
    return (
        <div>
            <Modal
                title="注意事项(2023-05-22)"
                open={modalIsOpen}
                onOk={() => setModalIsOpen(false)}
                onCancel={() => setModalIsOpen(false)}
                style={{fontFamily: 'Arial, sans-serif', top: 20}}
                okText={"知道了"}
            >
                <h2 style={{color: '#333', marginBottom: '15px'}}>原开发者北北</h2>

                <p>原网站链接：<a href={"https://bitboxtools.github.io"}>https://bitboxtools.github.io</a></p>
                <p>原开源地址链接：<a
                    href={"https://github.com/wxtsky/MyWalletScan"}>https://github.com/wxtsky/MyWalletScan</a>
                </p>
            </Modal>
        </div>
    )
}
export default Notice;
