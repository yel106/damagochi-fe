import React, { useState, useEffect } from "react";
import SockJS from "sockjs-client";
import * as StompJS from "@stomp/stompjs";
import axios from "axios";
import { Ba } from "../../Ba";
import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router";

const BattleRoom = () => {
  const [stompClient, setStompClient] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [battleRooms, setBattleRooms] = useState([]);
  const [battleMessage, setBattleMessage] = useState(null);
  const navigate = useNavigate();

  const connectWebSocket = () => {
    const client = new StompJS.Client({
      webSocketFactory: () => new SockJS("/battle"),
      connectHeaders: {
        accessToken: localStorage.getItem("accessToken"), // 예시
      },
      onConnect: () => {
        setStompClient(client);
        createBattleRoom(client);
        // WebSocket 연결 후 5초 지연하여 fetchBattleRooms 실행
        setTimeout(() => {
          fetchBattleRooms(currentRoom, setBattleRooms);
        }, 5000);
      },
      onStompError: (error) => {
        console.error(error);
      },
    });
    client.activate();
  };

  const subscribeToRoom = (roomId, client) => {
    console.log("구독 시작");
    const roomTopic = `/topic/battleRooms/${roomId}`;
    client.subscribe(roomTopic, (message) => {
      // 여기서 받은 메시지를 처리하는 로직
      console.log(message);
    });
  };

  const createBattleRoom = (client) => {
    if (client && client.connected) {
      client.publish({
        destination: "/app/createBattleRoom",
        headers: {
          accessToken: localStorage.getItem("accessToken"),
        },
        body: JSON.stringify({}),
      });
    } else {
      console.error("WebSocket Client is not connected.");
    }
  };

  useEffect(() => {
    console.log(battleMessage);
  }, [battleMessage]);
  useEffect(() => {
    axios
      .get("/api/battleRooms")
      .then((response) => {
        setBattleRooms(response.data);
      })
      .catch((error) => {
        console.error("Error fetching battle rooms:", error);
      });
  }, []); // 빈 의존성 배열 사용
  //다른페이지로 이동시 연결해제 로직
  useEffect(() => {
    console.log("웹소켓 연결종료 로직 시작");
    console.log("stompClient : " + stompClient);
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
        console.log("웹소켓 연결 종료");
      }
    };
  }, [stompClient, navigate]);

  const fetchBattleRooms = (currentRoom, setBattleRooms) => {
    axios
      .get("/api/battleRooms")
      .then((response) => {
        setBattleRooms(response.data);
      })
      .catch((error) => {
        console.error("Error fetching battle rooms:", error);
      });
  };

  const joinRoom = (battleRoomId) => {
    const accessToken = localStorage.getItem("accessToken");
    // 웹소켓이 연결되어 있지 않다면 먼저 연결을 시도
    if (!stompClient || !stompClient.connected) {
      const client = new StompJS.Client({
        webSocketFactory: () => new SockJS("/battle"),
        connectHeaders: {
          accessToken: localStorage.getItem("accessToken"),
        },
        onConnect: () => {
          setStompClient(client);
          // 현재 참여한 방에 대한 경로 구독
          client.subscribe(`/topic/battleRoom/${battleRoomId}`, (message) => {
            console.log(message.body);
            const messageData = JSON.parse(message.body);
            console.log(messageData);
            setBattleMessage(messageData);
          });
          // 연결이 성공하면 publish를 사용하여 배틀룸 참여 요청을 보냄
          client.publish({
            destination: "/app/createBattleRoom",
            headers: { accessToken },
            body: JSON.stringify({ battleRoomId }),
          });
          setCurrentRoom(battleRoomId); // 현재 참여한 방 설정
          // WebSocket 연결 후 5초 지연하여 fetchBattleRooms 실행
          setTimeout(() => {
            fetchBattleRooms(currentRoom, setBattleRooms);
          }, 5000);
        },
        onStompError: (error) => {
          console.error(error);
        },
      });
      client.activate();
    } else {
      // 현재 참여한 방에 대한 경로 구독
      stompClient.subscribe(`/topic/battleRoom/${battleRoomId}`, (message) => {
        console.log(message.body);
        const messageData = JSON.parse(message.body);
        console.log(messageData);
        setBattleMessage(messageData);
      });
      // 웹소켓이 이미 연결되어 있으면 publish를 사용하여 참여 요청을 보냄
      stompClient.publish({
        destination: "/app/createBattleRoom",
        headers: { accessToken },
        body: JSON.stringify({ battleRoomId }),
      });
      setCurrentRoom(battleRoomId); // 현재 참여한 방 설정
      // WebSocket 연결 후 5초 지연하여 fetchBattleRooms 실행
      setTimeout(() => {
        fetchBattleRooms(currentRoom, setBattleRooms);
      }, 5000);
    }
  };
  // 서버로부터 응답을 받는 부분 구현 필요

  return (
    <div align={"center"}>
      <Button onClick={connectWebSocket} p={8} mt={10} colorScheme={"yellow"}>
        배틀 방 만들기
      </Button>
      {currentRoom && <div>Current Battle Room ID: {currentRoom}</div>}
      <Flex p={10} justify={"center"}>
        <Text mr={3}>이용 가능한 배틀룸</Text>
        <Button onClick={() => fetchBattleRooms(currentRoom, setBattleRooms)}>
          <FontAwesomeIcon icon={faRotateRight} />
        </Button>
      </Flex>
      <ul>
        {battleRooms.map((room) => {
          // 현재 참여 중인 플레이어 수 계산
          const playerCount = Object.values(room.sessionIds).filter(
            (id) => id !== null,
          ).length;
          // 현재 참여한 방이거나 방이 이미 가득 찼다면 클릭할 수 없도록 설정
          const isClickable =
            currentRoom !== room.battleRoomId && playerCount < 2;
          return (
            <li key={room.battleRoomId}>
              <button
                onClick={() => isClickable && joinRoom(room.battleRoomId)}
                disabled={!isClickable}
                style={{
                  cursor: isClickable ? "pointer" : "not-allowed",
                  opacity: isClickable ? 1 : 0.5,
                }}
              >
                {room.battleRoomId + "번 방"} - Players: {playerCount}/2
              </button>
            </li>
          );
        })}
      </ul>
      <div>
        {/* ... 기존 UI 코드 */}
        {battleMessage &&
          currentRoom &&
          (battleMessage.sessionIds.B ? (
            // B가 존재할 경우 Ba 컴포넌트 렌더링
            <Ba message={battleMessage} roomId={currentRoom} />
          ) : (
            // B가 null일 경우 스피너 렌더링
            <div>
              매칭 중...
              <Spinner />
            </div> // 여기에 스피너 컴포넌트를 추가하세요.
          ))}
      </div>
    </div>
  );
};

export default BattleRoom;
