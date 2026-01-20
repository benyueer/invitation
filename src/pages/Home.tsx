import {
  CameraOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FormOutlined,
  HeartOutlined,
  MessageOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Input, message, Modal } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Magazine from "./Magazine";

const CARDS = [
  { name: "相册1", path: "/hero", icon: <HeartOutlined /> },
  { name: "相册2", path: "/vortex-gallery", icon: <CameraOutlined /> },
  {
    name: "相册3",
    path: "/repeating-image-transition",
    icon: <VideoCameraOutlined />,
  },
  { name: "相册4", path: "/infinity-canvas", icon: <FileTextOutlined /> },
  { name: "相册5", path: "/rolling-image", icon: <FormOutlined /> },
  { name: "相册6", path: "/magazine", icon: <MessageOutlined /> },
];

export default function Home() {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    message: "",
  });
  const handleContactSubmit = () => {
    console.log(contactInfo);
    setIsContactModalOpen(false);
    fetch("/message", {
      method: "POST",
      body: JSON.stringify({
        ...contactInfo,
        borwserId: localStorage.getItem("tracker_browser_id") || "",
        time: new Date().getTime(),
      }),
    })
      .then(() => {
        setContactInfo({
          name: "",
          message: "",
        });
        message.success("留言成功");
      })
      .catch(() => {
        message.error("留言失败");
      });
  };
  return (
    <div className="w-full h-100vh overflow-auto">
      <div
        className="w-full h-100vh bg-[url('/pics/main_bg.jpg')] bg-repeat relative overflow-hidden"
        style={{ backgroundSize: "110%", backgroundPosition: "-10px 0" }}
      >
        <div
          className="absolute top-50vh left-10vw w-50vw h-50vw z-10 transform rotate-z--80"
          style={{
            background: "url(/pics/ytdvvh.png)",
            backgroundSize: "100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div
          className="absolute top-20 left-50% transform -translate-x-1/2 w-65vw h-10vh bg-no-repeat"
          style={{
            background: "url(/pics/welcome.png)",
            backgroundSize: "100% 110%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div
          className="absolute top-45 left-50% transform -translate-x-1/2 w-45vw h-5vh"
          style={{
            background: "url(/pics/welcome_2.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div
          className="absolute top-55% left-50% transform -translate-1/2 w-75vw h-75vw"
          style={{
            background: "url(/pics/xizi.png)",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div
            className="absolute top--10 left--10 w-30 h-30"
            style={{
              background: "url(/pics/firework.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top--10 right--10 w-30 h-30 scale-x-[-1]"
            style={{
              background: "url(/pics/firework.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-20 right--10 w-10 h-10"
            style={{
              background: "url(/pics/heart1.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-45 right--17 w-15 h-5"
            style={{
              background: "url(/pics/heart2.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-65 right--12 w-12 h-5"
            style={{
              background: "url(/pics/heart3.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-65 left--12 w-15 h-15"
            style={{
              background: "url(/pics/heart3.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-35 left--12 w-12 h-5"
            style={{
              background: "url(/pics/heart1.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-5 left--10 w-5 h-5"
            style={{
              background: "url(/pics/heart3.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          <div
            className="absolute top-25 left--10 w-5 h-5"
            style={{
              background: "url(/pics/heart2.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
        </div>
        <div
          className="absolute bottom-10 left-50% transform -translate-x-1/2 w-80vw h-10"
          style={{
            background: "url(/pics/wel_c.png)",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
      </div>
      <div
        className="w-full bg-[url('/pics/main_bg.jpg')] bg-repeat relative overflow-hidden py-10"
        style={{ backgroundSize: "110%", backgroundPosition: "-10px 0" }}
      >
        <div
          className="w-60vw h-12vw mx-auto"
          style={{
            background: "url(/pics/invi.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        <div className="w-80vw mx-auto mt-10 mb-20">
          <div className="flex justify-between items-center">
            <div className="w-33vw h-33vw rounded-full bg-amber-500 relative overflow-hidden">
              <div
                className="w-full h-full rounded-full bg-white absolute top-0 left-0"
                style={{
                  background: "url(/images_high/v/theme1/IMG_1536.webp)",
                  backgroundSize: "180%",
                  backgroundPosition: "center 10%",
                  backgroundRepeat: "no-repeat",
                }}
              ></div>
            </div>
            <div className="w-8vw h-8vw">
              <img src="/pics/heart3.png" alt="" />
            </div>
            <div className="w-33vw h-33vw rounded-full bg-pink-400 relative overflow-hidden">
              <div
                className="w-full h-full rounded-full bg-white absolute top-0 left-0"
                style={{
                  background: "url(/images_high/v/theme1/IMG_1530.webp)",
                  backgroundSize: "180%",
                  backgroundPosition: "center 20%",
                  backgroundRepeat: "no-repeat",
                }}
              ></div>
            </div>
          </div>
          <div
            className="flex justify-between items-center px-4vw mt-3 color-red-700 font-800 text-2xl"
            style={{
              fontFamily: "uzxp",
            }}
          >
            <span>新郎：张世冬</span>
            <span>新娘：沈悦</span>
          </div>
          <div
            className="w-full flex flex-col gap-4 items-center color-red-700 mt-10vh text-5 font-600"
            style={{ fontFamily: "uzxp" }}
          >
            <p>钟于·忠于·衷于·终于</p>
            <p>我们结婚啦~</p>
            <p>是官方宣告也是真挚邀请</p>
            <p>诚邀您携家人见证我们的幸福时刻</p>
            <div className="px-4 py-2 my-2 rounded-2xl bg-amber">婚礼时间</div>
            <p>2026年2月13日</p>
            <p>农历腊月二十六（星期五）</p>
            <div className="px-4 py-2 my-2 rounded-2xl bg-amber">婚礼地址</div>
            <p>
              <EnvironmentOutlined style={{ color: "red" }} />
              罗山县彭新镇
            </p>
          </div>
        </div>
        <p
          className="text-center text-4xl font-800 color-red-700 mt-2vh"
          style={{ fontFamily: "uzxp" }}
        >
          好久不见，婚礼见
        </p>
      </div>
      <div
        className="w-full bg-[url('/pics/main_bg.jpg')] bg-repeat relative overflow-hidden"
        style={{ backgroundSize: "110%", backgroundPosition: "-10px 0" }}
      >
        <div className="w-full flex flex-col items-center mb-5">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="w-50vw py-3 rounded-xl bg-red-7 color-amber text-xl"
          >
            <span style={{ fontFamily: "uzxp" }}>联系我们</span>
          </button>
        </div>
        <div className="w-full flex flex-col items-center mb-20">
          <button
            onClick={() => navigate("/magazine")}
            className="w-50vw py-3 rounded-xl bg-red-7 color-amber text-xl"
          >
            <span style={{ fontFamily: "uzxp" }}>最好的我们</span>
          </button>
        </div>

        {/* <div className="grid grid-cols-2 gap-4 w-full mb-12 px-4">
          {CARDS.map(card => (
            <div
              key={card.name}
              onClick={() => navigate(card.path)}
              className="flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-lg shadow-xl transition-all active:scale-95 hover:shadow-2xl cursor-pointer"
              style={{ border: '2px solid #FA5C5C' }}
            >
              <span className="text-sm font-medium tracking-widest">
                {card.name}
              </span>
            </div>
          ))}
        </div> */}
        {/* <div className='w-80vw h-120vw relative mx-auto mb-20vh overflow-hidden'>
          <Magazine />
        </div> */}
      </div>

      <Modal
        title={<div className="text-center w-full text-xl py-2">联系我们</div>}
        open={isContactModalOpen}
        onCancel={() => setIsContactModalOpen(false)}
        onOk={handleContactSubmit}
        okText="发送"
        cancelText="取消"
        centered
        styles={{
          body: {
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "20px",
          },
          mask: {
            backdropFilter: "blur(4px)",
          },
          header: { background: "transparent", borderBottom: "none" },
          footer: { borderTop: "none" },
        }}
        okButtonProps={{
          style: {
            height: "40px",
            borderRadius: "10px",
          },
        }}
        cancelButtonProps={{
          style: {
            height: "40px",
            borderRadius: "10px",
          },
        }}
      >
        <div className="space-y-4 py-4">
          <Input
            placeholder="您的姓名"
            value={contactInfo.name}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, name: e.target.value })
            }
            variant="filled"
            style={{ borderRadius: "12px", padding: "10px" }}
            maxLength={20}
          />
          <Input.TextArea
            placeholder="您的留言"
            rows={4}
            value={contactInfo.message}
            maxLength={100}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, message: e.target.value })
            }
            variant="filled"
            style={{ borderRadius: "12px", padding: "10px" }}
          />
        </div>
      </Modal>
    </div>
  );
}
