import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Form, Input } from 'antd';
import '../styles/main.css';
import io from 'socket.io-client';

const socket = io.connect("https://cinema-server-20fs.onrender.com");

const FIELDS = {
    NAME: "name",
    ROOM: "room"
}

const Main = () => {    
    const { NAME, ROOM } = FIELDS;
    const [values, setValues] = useState({ [NAME]: "", [ROOM]: "" });
    const [userExists, setUserExists] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [formLayout, setFormLayout] = useState('horizontal');
    const onFormLayoutChange = ({ layout }) => {
        setFormLayout(layout);
    };

    useEffect(() => {
        socket.on('userExists', () => {
            setUserExists(true);
        });
    }, []);

    useEffect(() => {
        socket.on('doesntExist', ({ values }) => {
            navigate(`/chat?name=${values[NAME]}&room=${values[ROOM]}`);
        });
    }, [NAME, ROOM, navigate]);

    const formItemLayout = formLayout === 'horizontal' ? {labelCol: {span: 7}, wrapperCol: {span: 14}} : null;
    const buttonItemLayout = formLayout === 'horizontal' ? {wrapperCol: {span: 14, offset: 9}} : null;

    const handleInputChange = (e, fieldName) => {
        const { value } = e.target;
        setValues(prevValues => ({...prevValues, [fieldName]: value}));
    };

    const handleClick = (e) => {
        const isDisabled = Object.values(values).some(value => !value);
        
        if (isDisabled) {
            e.preventDefault();
        } else {
            socket.emit('checkIfExists', { values });
        }
    }

    return (
    <div>
        <Card title="Log in" bordered={false} className="card">
            <Form
                {...formItemLayout}
                layout={formLayout}
                form={form}
                initialValues={{
                    layout: formLayout,
                }}
                onValuesChange={onFormLayoutChange}
                style={{
                    maxWidth: formLayout === 'inline' ? 'none' : 600,
                }}
                >
                <Form.Item label="Nickname">
                    <Input 
                        placeholder="Your nickname"
                        value={values[NAME]}
                        onChange={(e) => handleInputChange(e, NAME)}
                        onKeyDown={values[NAME].length !== 0 && values[ROOM].length !== 0 ? (e) => {if (e.key === 'Enter') handleClick();} : null }
                    />
                </Form.Item>
                <Form.Item label="Room">
                    <Input 
                        placeholder="Choose room"
                        value={values[ROOM]}
                        onChange={(e) => handleInputChange(e, ROOM)}
                        onKeyDown={values[NAME].length !== 0 && values[ROOM].length !== 0 ? (e) => {if (e.key === 'Enter') handleClick();} : null}
                    />
                </Form.Item>
                {userExists && <p className="user-exists">This user already exists!</p>}
                <Form.Item {...buttonItemLayout}>
                    <Button type="primary" onClick={handleClick}>Enter</Button>
                </Form.Item>
            </Form>
        </Card>
    </div>);
};

export default Main;
