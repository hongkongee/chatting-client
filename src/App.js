import './App.css';
import React, { useEffect, useRef, useState } from 'react';
import logo from './images/iologo.png';
import { io } from 'socket.io-client';

const webSocket = io('http://localhost:5000');

function App() {
  const messagesEndRef = useRef(null);
  const [userId, setUserId] = useState(''); // 유저가 보낼 아이디 (로그인)
  const [isLogin, setIsLogin] = useState(false); // 로그인 여부
  const [msg, setMsg] = useState(''); // 유저가 보낼 메세지
  const [msgList, setMsgList] = useState([]); // 서버로부터 받은 메세지들

  const [privateTarget, setPrivateTarget] = useState(''); // 1:1 대화 상대 아이디

  /* ================ 1. useEffect : 최초 렌더링 시 발생하는 이벤트 (서버로부터 리시브) ================ */
  // 이벤트 리스너 (from server) : sMessage - 서버로부터 받은 메세지
  useEffect(() => {
    if (!webSocket) return;

    function sMessageCallback(msg) {
      const { data, id, target } = msg; // target : 1:1 채팅 여부
      setMsgList((prev) => [
        ...prev,
        {
          msg: data,
          type: target ? 'private' : 'other', // target에 따른 스타일 적용
          id,
        },
      ]);
    }

    // 메세지 수신
    webSocket.on('sMessage', sMessageCallback);
    return () => {
      // useEffect 이벤트 리스너 해제
      webSocket.off('sMessage', sMessageCallback);
    };
  }, []);

  // 로그인을 할 때 아이디를 받기 : sLogin - 아이디
  useEffect(() => {
    if (!webSocket) return;
    function sLoginCallback(msg) {
      setMsgList((prev) => [
        ...prev,
        {
          msg: `${msg} joins the chat`,
          type: 'welcome',
          id: '',
        },
      ]);
    }
    webSocket.on('sLogin', sLoginCallback);
    return () => {
      webSocket.off('sLogin', sLoginCallback);
    };
  }, []);

  // 채팅창의 대화 목록 스크롤 다운
  useEffect(() => {
    scrollToBottom();
  }, [msgList]); // 메세지가 올 때마다 아래로 내리기

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ================ 2. Handler : 이벤트가 발생할 때 서버로 전송 ================ */

  // 로그인을 할 때(submit) 아이디를 서버에 전송
  const onSubmitHandler = (e) => {
    e.preventDefault();
    webSocket.emit('login', userId); // 서버로 아이디 전송
    setIsLogin(true);
  };

  // input태그(입력창)의 내용이 바뀔 때 발생하는 이벤트 핸들러
  const onChangeUserIdHandler = (e) => {
    setUserId(e.target.value); // 값을 상태값에 저장
  };

  // 채팅 전송 이벤트 핸들러 (form)
  const onSendSubmitHandler = (e) => {
    e.preventDefault();
    const sendData = {
      data: msg,
      id: userId,
      target: privateTarget, // 1:1 채팅 상대방 아이디도 같이 전송
    };
    webSocket.emit('message', sendData); // 서버에 메세지(아이디, 메세지) 전송
    setMsgList((prev) => [...prev, { msg, type: 'me', id: userId }]); // 내가 보낸 메세지
    setMsg('');
  };

  // 메세지 input 태그 핸들러
  const onChangeMsgHandler = (e) => {
    setMsg(e.target.value);
  };

  // 아이디 클릭 시 privateTarget 상태변수를 바꾸는 핸들러
  const onSetPrivateTarget = (e) => {
    const { id } = e.target.dataset;
    setPrivateTarget((prev) => (prev === id ? '' : id)); // toggle 방식
  };

  return (
    <div className="app-container">
      <div className="wrap">
        {isLogin ? (
          // 11
          <div className="chat-box">
            <h3>Login as a {userId}</h3>

            <ul className="chat">
              {/* 서버로부터 받은 메세지들 */}
              {msgList.map((v, i) =>
                // 입장 메세지
                /* 
                v = { msg: data, type: 'other', id }
                i =
                */

                v.type === 'welcome' ? (
                  // 입장 메세지
                  <li className="welcome">
                    <div className="line" />
                    <div>{v.msg}</div>
                    <div className="line" />
                  </li>
                ) : (
                  // 일반 메세지, className : me or other / private
                  <li
                    className={v.type}
                    key={`${i}_li`}
                    name={v.id}
                    data-id={v.id}
                    onClick={onSetPrivateTarget}
                  >
                    <div
                      className={
                        v.id === privateTarget ? 'private-user' : 'userId'
                      }
                      data-id={v.id}
                      name={v.id}
                    >
                      {v.id}
                    </div>
                    <div className={v.type} data-id={v.id} name={v.id}>
                      {v.msg}
                    </div>
                  </li>
                ),
              )}
              <li ref={messagesEndRef} />
            </ul>
            {/* 채팅 입력창 */}
            <form className="send-form" onSubmit={onSendSubmitHandler}>
              {/* privateTarget이 존재할 때, 이름을 표시 */}
              {privateTarget && (
                <div className="private-target">{privateTarget}</div>
              )}
              <input
                placeholder="Enter your message"
                onChange={onChangeMsgHandler}
                value={msg}
              />
              <button type="submit">send</button>
            </form>
          </div>
        ) : (
          // 로그인 이전 아이디 입력창
          <div className="login-box">
            <div className="login-title">
              <img src={logo} width="40px" height="40px" alt="logo" />
              <div>IOChat</div>
            </div>
            <form className="login-form" onSubmit={onSubmitHandler}>
              <input
                placeholder="Enter your ID"
                onChange={onChangeUserIdHandler}
                value={userId}
              />
              <button type="submit">Login</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
