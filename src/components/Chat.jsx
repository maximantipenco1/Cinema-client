import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, Input, Space, Popover  } from 'antd';
import { SmileOutlined, CloseOutlined, CaretDownOutlined } from '@ant-design/icons';
import io from 'socket.io-client';
import EmojiPicker from "emoji-picker-react";

const socket = io.connect("https://cinema-server-20fs.onrender.com");

const Chat = () => {
    const [state, setState] = useState([]);
    const { search } = useLocation();
    const [usersList, setUsersList] = useState([]);
    const [params, setParams] = useState(null);
    const [users, setUsers] = useState(0);
    const [message, setMessage] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [goBottom, setGoBottom] = useState(false);
    const [emoji, setEmoji] = useState(false);
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const chatAreaRef = useRef(null);
    const { Search } = Input;
    const content = (
        <div>
            {usersList.map((user, index) => (
                <p key={index}>{user.name}</p>
            ))}
        </div>
    );

    useEffect(() => {
        const isScrolledToBottom = chatAreaRef.current.clientHeight + chatAreaRef.current.scrollTop >= chatAreaRef.current.scrollHeight - 100;

        if (isScrolledToBottom) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
            setGoBottom(false);
        } else {
            setGoBottom(true);
        }
    }, [state]);

    useEffect(() => {
        return () => {
            window.location.reload();
        };
    }, []);

    useEffect(() => {
        socket.on('videoUpdate', ({ videoUrl }) => {
            videoRef.current.src = videoUrl;
        });
    }, []);

    useEffect(() => {
        socket.on('videoPlay', ({ currentTime }) => {
            videoRef.current.currentTime = currentTime;
            videoRef.current.play();
        });
    }, []);

    useEffect(() => {
        socket.on('videoPause', ({ currentTime }) => {
            videoRef.current.currentTime = currentTime;
            videoRef.current.pause();
        });
    }, []);

    useEffect(() => {
        const handleUnload = () => {
            socket.emit('leftRoom', { params });
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [params])

    useEffect(() => {
        socket.on('notLogged', ({ name, room }) => {
            setParams({ name, room });
            socket.emit('join', { name, room });
        });
    }, [])

    useEffect(() => {
        socket.on('logged', () => {
            navigate(`/`);
        });
    }, [navigate])

    useEffect(() => {
        const searchParams = Object.fromEntries(new URLSearchParams(search));
        socket.emit('checkIfLogged', searchParams);
    }, [search])

    useEffect(() => {
        socket.on('message', ({ data }) => {
            setState((_state) => ([ ..._state, data ]))
        });
    }, [])

    useEffect(() => {
        socket.on('joinRoom', () => {
            videoRef.current.pause();
        });
    }, [])

    useEffect(() => {
        socket.on('refreshUsers', ({ data: { users } }) => {
            setUsers(users.length);
            setUsersList(users);
        });
    }, [])

    const handleInputChange = ({ target: { value } }) => setMessage(value);

    const handleSend = () => {
        if (!message) return;

        socket.emit('sendMessage', { message, params });
        setMessage("");
    };

    const handleVideoPlay = () => {
        const currentTime = videoRef.current.currentTime;
        socket.emit('videoPlay', { currentTime, params });
    };
    
    const handleVideoPause = () => {
        const currentTime = videoRef.current.currentTime;
        socket.emit('videoPause', { currentTime, params });
    };

    const handleSearch = (value) => {
        setSearchValue("");
        socket.emit('updateVideo', { videoUrl: value, params });
    };

    const handleCloseMovie = () => {
        socket.emit('updateVideo', { videoUrl: "", params });
    };

    const scrollBottom = () => {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        setGoBottom(false);
    };

    const handleEmojies = () => {
        setEmoji(!emoji);
    };

    const closeEmojies = () => {
        setEmoji(false);
    };

    const onEmojiClick = ({ emoji }) => {
        setMessage(prevMessage => prevMessage + `${emoji}`);
    };

    const handleLeave = () => {
        socket.emit('leftRoom', { params });
        navigate(`/`);
    };

    return(
    <div>
        <Search placeholder="Find your movie here..." enterButton className="search" value={searchValue} onChange={(e) => setSearchValue(e.target.value)}onSearch={handleSearch} />
        <Button type="primary" className="leave-chat" onClick={handleLeave}>Leave chat</Button>
        <Card title={"Movie"} bordered={false} className="movie" extra={<Button shape="circle" onClick={handleCloseMovie}><CloseOutlined /></Button>}>
            <video ref={videoRef} controls width="100%" onPlay={handleVideoPlay} onPause={handleVideoPause}>
                <source src="" type="video/mp4" />
            </video>
        </Card>
        <Card title={"Chat"} bordered={false} className="chat" extra={<Popover content={content} title="Users:">{users} users in this room</Popover>}>
            {goBottom && <Button shape="circle" className="go-bottom" onClick={scrollBottom}><CaretDownOutlined /></Button>}
            <div ref={chatAreaRef} className="chat-area" onClick={closeEmojies}>{state.map(({ user, message }, i) => {
                const itsMe = user.name.trim().toLowerCase() === params.name.trim().toLowerCase();

                return (
                <div key={i} className={itsMe ? "message-box me" : "message-box"}>
                    <p>{ user.name + ":" }</p>
                    <p className={itsMe ? "message-cloud me" : "message-cloud"}>{ message }</p>
                </div>);
            })}</div>
            <Space.Compact className="input">
                {emoji &&
                <div className="emoji-picker">
                    <EmojiPicker onEmojiClick={onEmojiClick}/>
                </div>}
                <Input placeholder="Write here your message..." suffix={<Button type="text" onClick={handleEmojies}><SmileOutlined className="emojies" /></Button>} onChange={handleInputChange} value={message} onKeyDown={(e) => {if (e.key === 'Enter') handleSend();}} />
                <Button type="primary" className="send_button" onClick={handleSend}>Send</Button>
            </Space.Compact>
        </Card>
    </div>);
};

export default Chat;