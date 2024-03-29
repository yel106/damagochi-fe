import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Flex,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Cart } from "./Cart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationPinLock,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

function ItemView(props) {
  const { storeId } = useParams(); //URL에서 동적인 값을 컴포넌트 내에서 쓸때 사용. <Route>컴포넌트 내에서 렌더링되는 컴포넌트에서만 사용가능
  const [item, setItem] = useState(null);
  const [fileURL, setFileURL] = useState([]);
  const [memberInfo, setMemberInfo] = useState({ playerId: "" });
  const [itemCount, setItemCount] = useState(1);
  const [cartItem, setCartItem] = useState([]);

  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (localStorage.getItem("accessToken") !== null) {
      console.log(localStorage.getItem("accessToken"));
      axios
        .get("/api/store/accessToken", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })
        .then((response) => {
          setMemberInfo(response.data);
          handleGetCart(response.data.playerId);
        })
        .catch()
        .finally();
    }
  }, []);

  useEffect(() => {
    axios
      .get("/api/store/item/view/id/" + storeId)
      .then((response) => setItem(response.data))
      .catch((error) => console.log(error))
      .finally(() => console.log("끝"));
  }, []);

  if (item === null) {
    return <Spinner />;
  }

  function handleDelete() {
    axios
      .delete("/api/store/item/delete", {
        data: {
          storeId: item.storeId,
          category: item.itemCategory,
        },
      })
      .then((response) => {
        toast({
          description: storeId + "번 아이템이 삭제되었습니다.",
          status: "success",
        });
        navigate("/store/item/list");
      })
      .catch((error) => {
        toast({
          description: "삭제 중 문제가 발생하였습니다.",
          status: "error",
        });
      })
      .finally(() => onClose());
  }

  // 카트 아이템을 다시 불러와서 밑에 함수에서 카트를 추가하면 다시 새로운 정보를 불러오는 방식으로 해결하기
  function handleGetCart(playerId) {
    axios
      .get("/api/cart/itemInfo", {
        params: { playerId: playerId },
      })
      .then((response) => setCartItem(response.data))
      .catch((error) => {
        console.log("카트 아이템의 정보를 가져오는데 실패하였습니다.");
      })
      .finally();
  }

  function handleAddCart() {
    // cartItem 배열에서 현재 사용자의 아이템을 찾기
    const addItem = cartItem.find(
      (item) => item.playerId === memberInfo.playerId,
    );

    // 새로 추가될 아이템 정보
    const newCartItem = {
      storeId: item.storeId,
      category: item.itemCategory,
      playerId: memberInfo.playerId,
      itemName: item.itemName,
      itemCount: itemCount,
      itemCode: item.itemCode,
    };

    const updatedCartItems = [...cartItem, newCartItem];
    setCartItem(updatedCartItems);
    axios
      .post("/api/cart/add", {
        storeId: item.storeId,
        category: item.itemCategory,
        playerId: memberInfo.playerId,
        itemName: item.itemName,
        itemCount: itemCount,
        itemCode: item.itemCode,
      })
      .then(async (response) => {
        console.log(response.data);
        // 성공적인 응답 후, 장바구니 상태 업데이트
        // updateCartState(response.data.newItem);
        toast({
          description: item.itemName + " 아이템이 장바구니에 추가되었습니다",
          status: "success",
        });
        //여기에 아이템 정보 업데이트 하는 함수 추가
        handleGetCart(memberInfo.playerId);
      })
      .catch((error) => {
        // 요청 실패 시, 장바구니 상태를 이전 상태로 되돌림
        setCartItem(cartItem);
        toast({
          description: "로그인이 필요합니다",
          status: "error",
        });
      });
  }

  return (
    <>
      <Cart cartItems={cartItem} storeId={item.storeId} />

      <Container border="0px solid black" w="40%" h="70%" mt="5%" mb="5%">
        <Spacer h={100} />
        <Card
          // border="6px solid #B893BA"

          border="5px solid #B893BA"
          borderRadius={"5%"}
          bgGradient="linear(to-l, #7928CA, #FF0080)"
          bgClip="text"
          boxShadow={"0 0 10px rgba(121, 40, 202, 0.5)"}
          mr="15%"
          width={"65%"}
        >
          <CardHeader>
            <Flex mb={3} justify={"right"}>
              <Button
                colorScheme="purple"
                mr={1}
                onClick={() => navigate("/store/item/edit/id/" + storeId)}
              >
                편집
              </Button>

              <Button colorScheme="red" onClick={onOpen}>
                삭제
              </Button>
            </Flex>
            <Flex>
              {item.itemFiles.map((e, index) => (
                <Box key={e.id} border={"0px solid green"}>
                  <Image
                    mr={3}
                    width="150px"
                    height="100px"
                    // objectFit="cover"
                    src={e.fileUrl}
                  />
                </Box>
              ))}
            </Flex>
          </CardHeader>
          <CardBody>
            <Box mb={2} fontWeight="bold" fontSize={"lg"}>
              {item.itemName}
            </Box>
            <Box mb={2}>분 류 : {item.itemCategory}</Box>
            <Box mb={2}>기 능 : {item.itemFunction}</Box>
            <Box>가 격 : {item.itemPrice} 포인트</Box>
          </CardBody>
          <CardFooter>
            <ButtonGroup>
              {/* 아이템 갯수 증감 */}
              <Button
                borderRadius={"50%"}
                width={"40px"}
                mr={1}
                bg={"#F2AE39"}
                color={"white"}
                _hover={{
                  bg: "#E57A08",
                  color: "white",
                }}
                onClick={() => {
                  if (itemCount > 1) {
                    setItemCount(itemCount - 1);
                  }
                }}
              >
                <FontAwesomeIcon icon={faMinus} />
              </Button>
              <Text mt={1}>{itemCount}</Text>
              <Button
                borderRadius={"50%"}
                width={"40px"}
                mr={2}
                bg={"#E5507D"}
                color={"white"}
                _hover={{
                  bg: "#E5087E",
                  color: "white",
                }}
                bg={"#E5507D"}
                color={"white"}
                _hover={{
                  bg: "#E5087E",
                  color: "white",
                }}
                onClick={() => {
                  if (itemCount > 0) {
                    setItemCount(itemCount + 1);
                  }
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>

              <Button
                variant="solid"
                colorScheme="purple"
                onClick={() => handleAddCart()}
              >
                담기
              </Button>
              <Button
                onClick={() => navigate(`/purchase/${item.storeId}`)}
                variant="solid"
                bgGradient="linear(to-l, #7928CA, #FF0080)"
                color={"white"}
                _hover={{
                  bgGradient: "linear(to-l, #AB47BC, #FF4081)",
                  color: "white",
                }}
              >
                구매
              </Button>
            </ButtonGroup>
          </CardFooter>
        </Card>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>아이템 삭제</ModalHeader>
            <ModalCloseButton />
            <ModalBody>아이템을 삭제 하시겠습니까?</ModalBody>
            <ModalFooter>
              <Button onClick={onClose} colorScheme="purple" mr={1}>
                닫기
              </Button>
              <Button onClick={handleDelete} colorScheme="red">
                삭제
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/*</Box>*/}
        <Spacer h={500} />
      </Container>
    </>
  );
}

export default ItemView;
