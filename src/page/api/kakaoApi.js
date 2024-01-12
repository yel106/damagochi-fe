import async from "async";
import axios from "axios";

const rest_api_key = "4635a56637b1de939e74c4b11918985a"; //REST키값
const redirect_uri = "http://localhost:5000/loginprocess/KAKAO";
const auth_code_path = "https://kauth.kakao.com/oauth/authorize";
const access_token_url = "https://kauth.kakao.com/oauth/token";
export const getKakaoLoginLink = () => {
  const kakaoURL = `${auth_code_path}?client_id=${rest_api_key}&redirect_uri=${redirect_uri}&response_type=code`;
  return kakaoURL;
};
export const getAccessToken = async (authCode) => {
  const header = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  const params = {
    grant_type: "authorization_code",
    client_id: rest_api_key,
    redirect_uri: redirect_uri,
    code: authCode,
    client_secret: "KcgTo4D16GgOo254GVHCba0Uhh9hv530",
  };
  const res = await axios.post(access_token_url, params, header);
  const accessToken = res.data.access_token;
  return accessToken;
};
export const getMemberWithAccessToken = async (accessToken) => {
  const res = await axios.get(`/api/member/kakao?accessToken=${accessToken}`);
  return res.data;
};
