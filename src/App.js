//IMPORTS
import React, { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import idl from "./idl.json";
import kp from "./keypair.json";

//CONSTANTS
const { SystemProgram, Keypair } = web3;
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey("8UbJVF2h6sS1YmiP3acJKdC9YUro1yao1AqP7XnZeAaC");
const network = clusterApiUrl("devnet");
const opts = {
    preflightCommitment: "processed",
};

const App = () => {
    //useSTATE
    const [walletAddress, setWalletAddress] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [gifList, setGifList] = useState([]);

    //TOASTS

    const showPhantomToast = () =>
        toast("To sign in, download a Phantom Wallet 👻 at https://phantom.app");
    const showConnectedWalletToast = () => toast.success("You're signed in!");
    const showDisconnectedWalletToast = () => toast.success("You've signed out!");
    const showGifSentToast = () => toast.success("GIF Sent!");

    //ACTIONS

    const checkIfWalletIsConnected = async () => {
        try {
            const { solana } = window;

            if (solana) {
                if (solana.isPhantom) {
                    console.log("Phantom wallet found!");

                    const response = await solana.connect({ onlyIfTrusted: true });
                    console.log(
                        "Connected with Public Key:",
                        response.publicKey.toString()
                    );
                    setWalletAddress(response.publicKey.toString());
                }
            } else {
                showPhantomToast();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const connectWallet = async () => {
        const { solana } = window;

        if (solana) {
            const response = await solana.connect();
            console.log("Connected with Public Key:", response.publicKey.toString());
            setWalletAddress(response.publicKey.toString());
            showConnectedWalletToast();
        }
    };

    const disconnectWallet = () => {
        console.log("Wallet Disconnected");
        setWalletAddress(null);
        showDisconnectedWalletToast();
    };

    const onInputChange = (event) => {
        const { value } = event.target;
        setInputValue(value);
    };

    const getProgram = async () => {
        const idl = await Program.fetchIdl(programID, getProvider());
        return new Program(idl, programID, getProvider());
    };

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new Provider(
            connection,
            window.solana,
            opts.preflightCommitment
        );
        return provider;
    };

    const createGifAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            console.log("ping");
            await program.rpc.startStuffOff({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount],
            });
            console.log(
                "Created a new BaseAccount w/ address:",
                baseAccount.publicKey.toString()
            );
            await getGifList();
        } catch (error) {
            console.log("Error creating BaseAccount account:", error);
        }
    };

    const shortenAddress = (address) => {
        if (!address) return "";
        return address.substring(0, 4) + "....." + address.substring(40);
    };

    const getGifList = async () => {
        try {
            const program = await getProgram();
            const account = await program.account.baseAccount.fetch(
                baseAccount.publicKey
            );

            console.log("Got the account", account);
            setGifList(account.gifList);
        } catch (error) {
            console.log("Error in getGifList: ", error);
            setGifList(null);
        }
    };

    const sendGif = async () => {
        if (inputValue.length === 0) {
            console.log("No gif link given!");
            return;
        }
        setInputValue("");
        console.log("Gif link:", inputValue);
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            await program.rpc.addGif(inputValue, {
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                },
            });
            console.log("GIF successfully sent to program", inputValue);

            await getGifList();
            showGifSentToast();
        } catch (error) {
            console.log("Error sending GIF:", error);
        }
    };

    const renderNotConnectedContainer = () => (
        <div className="container">
            <button
                className="cta-button connect-wallet-button"
                onClick={connectWallet}
            >
                SIGN IN
            </button>
            <p className="header">Scene Portal</p>
            <p className="sub-header">Your favorite scenes, on the blockchain</p>
            <div className="moon" />
            <div className="kiki" />
        </div>
    );

    const renderConnectedContainer = () => {
        if (gifList === null) {
            return (
                <div className="connected-container">
                    <button
                        className="cta-button submit-gif-button"
                        onClick={createGifAccount}
                    >
                        Do One-Time Initialization For GIF Program Account
                    </button>
                </div>
            );
        } else {
            return (
                <div className="connected-container">
                    <p className="connected-header">SCENE PORTAL</p>
                    <button
                        className="cta-button disconnect-wallet-button"
                        onClick={disconnectWallet}
                    >
                        SIGN OUT {shortenAddress(walletAddress)}
                    </button>
                    <form
                        className="form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            sendGif();
                        }}
                    >
                        <input
                            type="text"
                            placeholder="post your favorite film/tv scene"
                            value={inputValue}
                            onChange={onInputChange}
                        />
                        <button type="submit" className="cta-button submit-gif-button">
                            SUBMIT
                        </button>
                    </form>
                    <div className="gif-grid">
                        {gifList.map((item, index) => (
                            <div className="gif-item" key={index}>
                                <img className="gif-image" src={item.gifLink} alt={item.gifLink} />
                                <div className="address-tag">
                                    <img
                                        className="phantom-image"
                                        src="https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,f_auto,q_auto:eco,dpr_1/sqzgmbkggvc1uwgapeuy"
                                        alt="Phantom Wallet"
                                    />
                                    <p className="address">
                                        @{shortenAddress(item.userAddress.toString())}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };

    //useEFFECTS

    useEffect(() => {
        const onLoad = async () => {
            await checkIfWalletIsConnected();
        };
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            console.log("Fetching GIF list...");

            // Call Solana program here.
            getGifList();
        }
    }, [walletAddress]);

    return (
        <div className="App">
            <div className={walletAddress ? "authed-container" : "container"}>
                <Toaster
                    toastOptions={{
                        className: "",
                        duration: 3000,
                        style: {
                            border: "1px solid #713200",
                            padding: "16px",
                            color: "#713200",
                        },
                    }}
                />
                <div className="header-container">
                    {!walletAddress && renderNotConnectedContainer()}
                    {walletAddress && renderConnectedContainer()}
                </div>
            </div>
        </div>
    );
};

export default App;
