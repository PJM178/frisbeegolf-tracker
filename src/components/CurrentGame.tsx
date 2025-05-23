"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./CurrentGame.module.css"
import Dialog from "./Dialog";
import { Button, Switch } from "./Buttons";
import { ProgressActivity } from "./Loading";
import { Game, GameState, useGameState, Hole } from "@/context/GameStateContext";
import { generateRandomId } from "@/utils/utilities";
import PlayerScoreGrid from "./PlayerScoreGrid";

type NewGameType = Omit<Game, "startTime" | "endTime" | "currentHole">;

interface AddPlayerInputProps {
  index: number;
  playerId: string;
  setNewGameProps: React.Dispatch<React.SetStateAction<NewGameType>>;
  playerName: string;
}

const AddPlayerInput = memo(function AddPlayerInput(props: AddPlayerInputProps) {
  const handleInputChangeEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.setNewGameProps((prevValue) => ({
      ...prevValue,
      players: prevValue.players.map((player) =>
        player.id === props.playerId
          ? { ...player, name: e.target.value }
          : player
      ),
    }));
  };

  const handleRemovePlayer = () => {
    props.setNewGameProps((prevValue) => ({
      ...prevValue,
      players: prevValue.players.filter((player) => player.id !== props.playerId),
    }));
  };

  return (
    <div className={styles["new-game-form--form--players-input"]}>
      <input
        onChange={handleInputChangeEvent}
        value={props.playerName}
        id={props.playerId}
      />
      <div
        className={styles["new-game-form--form--players-remove-icon"]}
        onClick={props.index === 0 ? undefined : handleRemovePlayer}
      >
        <span className={`material-symbol--container material-symbols-outlined`.trim()}>
          {props.index === 0 ? undefined : "person_remove"}
        </span>
      </div>
    </div>
  );
});

interface NewGameFormProps {
  closeDialog: () => void;
}

const NewGameForm = (props: NewGameFormProps) => {
  const [newGameProps, setNewGameProps] = useState<NewGameType>({
    name: "Uusi peli",
    holes: 1,
    players: [{ name: "", id: generateRandomId(), totalScore: 0 }],
    location: null,
    id: generateRandomId(),
    holeList: [],
  });

  const { setGameState, metaData, setMetaData } = useGameState();
  console.log(metaData);
  const handleGameName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGameProps({ ...newGameProps, name: e.target.value });
  };

  const handleGameHoles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (Number(e.target.value) && Number(e.target.value) < 0) {
      setNewGameProps({ ...newGameProps, holes: 1 });
    } else if (e.target.value.length === 0) {
      setNewGameProps({ ...newGameProps, holes: "" });
    } else {
      setNewGameProps({ ...newGameProps, holes: +e.target.value });
    }
  };

  const handleGameHolesBlur = () => {
    if (!newGameProps.holes) {
      setNewGameProps({ ...newGameProps, holes: 1 })
    }
  };

  const handleAddPlayer = () => {
    setNewGameProps((prevValue) => ({
      ...prevValue,
      players: [
        ...prevValue.players,
        { name: "", id: generateRandomId(), totalScore: 0 }
      ]
    }));
  };

  // When adding new players focus the input field
  // If the field already has value, don't focus it, so in the cases when deleting players
  useEffect(() => {
    if (newGameProps.players.length > 1) {
      const element = document.getElementById(newGameProps.players[newGameProps.players.length - 1].id) as HTMLInputElement;

      if (element) {
        if (!element.value) {
          element.focus();
        }
      }
    }
  }, [newGameProps.players]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const populateHoles = Array.from({ length: Number(newGameProps.holes) || 1 }, (_, i) => {
      const hole: Hole = { hole: i + 1, scores: [...newGameProps.players], id: generateRandomId(), isActive: true };

      return hole;
    });

    setGameState((prevValue) => {
      const clonedValue = { ...prevValue };

      clonedValue.currentGame = {
        id: newGameProps.id,
        name: newGameProps.name,
        players: newGameProps.players,
        location: newGameProps.location,
        holes: newGameProps.holes || 1,
        holeList: populateHoles,
        currentHole: populateHoles[0].id,
        startTime: new Date().getTime(),
        endTime: null,
      }

      return clonedValue;
    });

    props.closeDialog();
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLInputElement).tagName === "INPUT") {
      e.preventDefault();
    }
  };

  const handleLocation = async () => {
    if (!metaData || metaData.permissions.geolocation === "denied") {
      return;
    }

    if (newGameProps.location) {
      setNewGameProps({ ...newGameProps, location: null });

      return;
    }

    if (metaData.permissions.geolocation === "granted") {
      navigator.geolocation.getCurrentPosition((pos) => {
        console.log("Latitude: ", pos.coords.latitude);
        console.log("Longitude: ", pos.coords.longitude);

        setNewGameProps({ ...newGameProps, location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } });
      });
    }

    if (metaData.permissions.geolocation === "prompt") {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Latitude: ", pos.coords.latitude);
          console.log("Longitude: ", pos.coords.longitude);

          setNewGameProps({ ...newGameProps, location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } });
        },
        (err) => {
          setMetaData((prevValue) => {
            if (prevValue) {
              prevValue.permissions.geolocation = "denied";

              return { ...prevValue };
            }

            return prevValue;
          });

          console.error("Error prompting user: ", err.message);
        }
      );
    }
  }

  return (
    <div className={styles["new-game-form--container"]}>
      <div className={styles["new-game-form--title"]}>
        <div>Uusi peli</div>
        <div
          className={styles["new-game-form--title-symbol--container"]}
          onClick={props.closeDialog}
        >
          <div className={`material-symbol--container material-symbols-outlined`.trim()}>
            close
          </div>
        </div>
      </div>
      <form
        className={styles["new-game-form--form--container"]}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
      >
        <div className={styles["new-game-form--form--input-field"]}>
          <label htmlFor="new-game-name">Nimi</label>
          <input
            name="new-game-name"
            id="new-game-name"
            onChange={handleGameName}
            value={newGameProps.name}
          />
        </div>
        <div className={styles["new-game-form--form--input-field"]}>
          <label htmlFor="new-game-holes">Reiät</label>
          <input
            name="new-game-holes"
            id="new-game-holes"
            onChange={handleGameHoles}
            value={newGameProps.holes}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            pattern="[0-9]*"
            onBlur={handleGameHolesBlur}
            placeholder="Valitse "
          />
        </div>
        <div className={styles["new-game-form--form--input-field"]}>
          <label htmlFor="new-game-players">Pelaajat</label>
          <div id="new-game-players" className={styles["new-game-form--form--players-container"]}>
            {newGameProps.players.map((p, i) => (
              <AddPlayerInput
                key={p.id}
                index={i}
                setNewGameProps={setNewGameProps}
                playerId={p.id}
                playerName={p.name}
              />
            ))}
          </div>
          <div onClick={handleAddPlayer} className={styles["new-game-form--form--add-players"]}>
            <span>Lisää pelaaja</span>
            <div className={styles["new-game-form--form--players-remove-icon"]}>
              <span className={`material-symbol--container material-symbols-outlined`.trim()}>
                person_add
              </span>
            </div>
          </div>
        </div>
        <div className={styles["new-game-form--form--input-field-row"]}>
          <label>Tallenna sijainti</label>
          <Switch disabled={metaData && metaData.permissions.geolocation === "denied" ? true : false} isActive={newGameProps.location !== null ? true : false} onClick={handleLocation} />
        </div>
        <div className={styles["new-game-form--form--button-container"]}>
          <button
            id="close-modal"
            type="button"
          >
            Sulje
          </button>
          <button>Lisää peli</button>
        </div>
      </form>
    </div>
  );
};

const NewGame = () => {
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);

  return (
    <div className={styles["current-game--no-game"]}>
      <div
        onClick={() => setIsNewGameDialogOpen(true)}
        className={styles["current-game--new-game"]}
      >
        <b>Uusi peli&nbsp;</b>
        <span className={`material-symbol--container material-symbols-outlined`.trim()}>
          add
        </span>
      </div>
      <Dialog
        isOpen={isNewGameDialogOpen}
        closeModal={() => setIsNewGameDialogOpen(false)}
      >
        <NewGameForm closeDialog={() => setIsNewGameDialogOpen(false)} />
      </Dialog>
    </div>
  );
};

interface GameHoleProps extends Hole {
  handleHolePlayerScore: (dir: "inc" | "dec", holeId: string, playerId: string) => void;
  handleFinishHole: (holeId: string) => void;
}

const GameHole = memo(function GameHole(props: GameHoleProps) {
  console.log(props);
  return (
    <li className={`${styles["running-game--hole-info"]} ${!props.isActive ? styles["disabled"] : ""}`.trim()} id={"hole-" + props.id}>
      <div><span>Reikä&nbsp;</span><span>{props.hole}</span></div>
      {/* {props.currentHole === props.id && <>HERE BE CURRENT HOLE</>} */}
      <PlayerScoreGrid
        hasButtons={true}
        handleHolePlayerScore={props.handleHolePlayerScore}
        scores={props.scores}
        id={props.id}
        isActive={props.isActive}
        hole={props.hole}
      />
      <div
        className={styles["running-game--hole-info--finish-game--container"]}
      >
        <Button
          onClick={() => props.handleFinishHole(props.id)}
          variant="tertiary"
          endIcon={
            <span className={`material-symbol--container material-symbols-outlined--not-filled material-symbols-outlined`.trim()}>
              check_circle
            </span>
          }
        >
          <div
            className={styles["running-game--hole-info--finish-game--button"]}
          >
            <span>Reikä valmis</span>
          </div>
        </Button>
      </div>
    </li>
  );
});

interface GameInfoProps {
  currentGamePlayers: Game["players"];
};

const GameInfo = memo(function GameInfo(props: GameInfoProps) {
  const playerWithLowestScore = useMemo(() => props.currentGamePlayers.reduce((lowest, player) => (
    player.totalScore < lowest.totalScore ? player : lowest
  )), [props.currentGamePlayers]);

  return (
    <PlayerScoreGrid
      hasButtons={false}
      scores={props.currentGamePlayers}
      leadingPlayer={playerWithLowestScore}
    />
  );
});

interface RunningGameProps {
  currentGame: Game;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}

const RunningGame = (props: RunningGameProps) => {
  const { currentGame, setGameState } = props;
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [gameMoreInfoOpen, setGameMoreInfoOpen] = useState(false);
  const holeListRef = useRef<HTMLUListElement>(null);
  const holeListChildrenWidths = useRef<{ width: number, id: string }[]>(null);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(() => {
    const holeIndex = currentGame.holeList.findIndex((h) => h.id === currentGame.currentHole);

    return holeIndex < 0 ? 0 : holeIndex;
  });
  const scrollFromButton = useRef<boolean>(false);
  const holeIndexRef = useRef<number>(null);

  const handleFinishGame = () => {
    props.setGameState((prevValue) => {
      const clonedValue = { ...prevValue };

      if (clonedValue.currentGame) {
        clonedValue.history = [clonedValue?.currentGame, ...clonedValue.history];
      }

      clonedValue.currentGame = null;

      return clonedValue;
    })
  };

  // On mount scroll the hole that is current in the context object into view
  useEffect(() => {
    const element = document.getElementById("hole-" + currentGame.currentHole);

    if (element) {
      element.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Both total player game score and hole scores
  const handleHolePlayerScore = useCallback((dir: "inc" | "dec", holeId: string, playerId: string) => {
    if (dir === "inc") {
      setGameState((prevValue) => {
        if (!prevValue.currentGame) return prevValue;

        return {
          ...prevValue,
          currentGame: {
            ...prevValue.currentGame,
            players: prevValue.currentGame.players.map((p) => {
              return {
                ...p,
                totalScore: p.id === playerId ? p.totalScore + 1 : p.totalScore,
              };
            }),
            holeList: prevValue.currentGame.holeList.map((h) => {
              if (h.id === holeId) {
                return {
                  ...h,
                  scores: h.scores.map((p) =>
                    p.id === playerId
                      ? { ...p, totalScore: p.totalScore + 1 }
                      : p
                  ),
                };
              }

              return h;
            }),
          },
        };
      });
    } else {
      setGameState((prevValue) => {
        if (!prevValue.currentGame) return prevValue;

        return {
          ...prevValue,
          currentGame: {
            ...prevValue.currentGame,
            players: prevValue.currentGame.players.map((p) => {
              return {
                ...p,
                totalScore: p.id === playerId ? p.totalScore > 0 ? p.totalScore - 1 : p.totalScore : p.totalScore,
              };
            }),
            holeList: prevValue.currentGame.holeList.map((h) => {
              if (h.id === holeId) {
                return {
                  ...h,
                  scores: h.scores.map((p) =>
                    p.id === playerId
                      ? { ...p, totalScore: p.totalScore > 0 ? p.totalScore - 1 : p.totalScore }
                      : p
                  ),
                };
              }

              return h;
            }),
          },
        };
      });
    }
  }, [setGameState]);

  const handleFinishHole = useCallback((holeId: string) => {
    setGameState((prevValue) => {
      if (!prevValue.currentGame) return prevValue;

      const holeIndex = prevValue.currentGame.holeList.findIndex((h) => h.id === holeId);

      // Update the holeList
      const updatedHoleList = prevValue.currentGame.holeList.map((h) => {
        if (h.id === holeId) {
          return { ...h, isActive: !h.isActive };
        }

        return h;
      });

      // If it's the last hole, add a new one
      if (holeIndex === prevValue.currentGame.holeList.length - 1) {
        const lastHole = prevValue.currentGame.holeList[holeIndex];
        const newHole = {
          id: generateRandomId(),
          hole: lastHole.hole + 1,
          isActive: true,
          scores: lastHole.scores.map((s) => {
            const clonedPlayer = { ...s };
            clonedPlayer.totalScore = 0;

            return clonedPlayer;
          }),
        };

        updatedHoleList.push(newHole);
      }

      // Update the holeIndexRef for scrolling purposes in the useEffect hook - holeList replacing causes it to trigger
      // Could possibly update currentHoleIndex outsite of this state updating but the problem is preventing 
      // all the GameHoles from re-rendering since this function should be recreated when currentGame.holeList is updated
      if (prevValue.currentGame.holeList[holeIndex].isActive) {
        holeIndexRef.current = holeIndex + 1;
      } else {
        holeIndexRef.current = null;
      }

      return {
        ...prevValue,
        currentGame: {
          ...prevValue.currentGame,
          currentHole: prevValue.currentGame.holeList[holeIndex].id,
          holeList: updatedHoleList,
        },
      };
    });
  }, [setGameState]);

  const handleScrollNextHole = () => {
    if (currentHoleIndex + 1 < currentGame.holeList.length) {
      scrollFromButton.current = true;

      setCurrentHoleIndex(currentHoleIndex + 1);

    }
  };

  const handleScrollPreviousHole = () => {
    if (currentHoleIndex !== 0) {
      scrollFromButton.current = true;

      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  const handleHoleOptionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    scrollFromButton.current = true;

    setCurrentHoleIndex(+e.target.value - 1);
  };

  // Side effect of currentHoleIndex changes is defined here, scrollFromButton ref is used to prevent
  // onScrollEnd event from affecting this hook
  useEffect(() => {
    if (!scrollFromButton.current && !holeIndexRef.current) return;

    const hole = currentGame.holeList[holeIndexRef.current ?? currentHoleIndex];
    holeIndexRef.current = null;

    if (!hole) return;

    const element = document.getElementById("hole-" + hole.id);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });

      setGameState((prevValue) => {
        if (prevValue.currentGame) {
          prevValue.currentGame.currentHole = hole.id;

          return { ...prevValue };
        }

        return prevValue;
      });
    }
  }, [currentHoleIndex, currentGame.holeList, setGameState]);

  // Scroll into view the closest child node when the scrolling ends
  const handleULOnScrollEnd = (e: React.UIEvent<HTMLUListElement, UIEvent>) => {
    if (scrollFromButton.current) {
      scrollFromButton.current = false;

      return;
    }

    const ul = e.target as HTMLElement;
    let endingWidth = ul.scrollLeft;

    if (!holeListChildrenWidths.current) {
      holeListChildrenWidths.current = Array.from(ul.children).map((c) => {
        const el = c as HTMLElement;

        return { width: el.offsetWidth, id: el.id };
      });
    }

    for (let i = 0; i < holeListChildrenWidths.current.length; i++) {
      const currentWidth = holeListChildrenWidths.current[i].width;
      endingWidth -= holeListChildrenWidths.current[i].width;

      if (endingWidth < 0) {
        if (currentHoleIndex > i) {
          if (Math.abs(endingWidth) > currentWidth * 0.3) {
            const element = document.getElementById(holeListChildrenWidths.current[i].id);

            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "nearest" });

              setGameState((prevValue) => {
                if (prevValue.currentGame) {
                  if (holeListChildrenWidths.current && prevValue.currentGame.currentHole !== holeListChildrenWidths.current[i].id.split("-")[1]) {
                    prevValue.currentGame.currentHole = holeListChildrenWidths.current[i].id.split("-")[1];

                    return { ...prevValue };
                  }
                }

                return prevValue;
              });

              setCurrentHoleIndex(i);

              return;
            }
          }
        }

        if (Math.abs(endingWidth) < currentWidth * 0.7) {
          const element = document.getElementById(holeListChildrenWidths.current[i + 1].id);

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "nearest" });

            setGameState((prevValue) => {
              if (prevValue.currentGame) {
                if (holeListChildrenWidths.current && prevValue.currentGame.currentHole !== holeListChildrenWidths.current[i + 1].id.split("-")[1]) {
                  prevValue.currentGame.currentHole = holeListChildrenWidths.current[i + 1].id.split("-")[1];

                  return { ...prevValue };
                }
              }

              return prevValue;
            });

            setCurrentHoleIndex(i + 1);

            return;
          }
        }

        const element = document.getElementById(holeListChildrenWidths.current[i].id);

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });

          setGameState((prevValue) => {
            if (prevValue.currentGame) {
              if (holeListChildrenWidths.current && prevValue.currentGame.currentHole !== holeListChildrenWidths.current[i].id.split("-")[1]) {
                prevValue.currentGame.currentHole = holeListChildrenWidths.current[i].id.split("-")[1];

                return { ...prevValue };
              }
            }

            return prevValue;
          });

          setCurrentHoleIndex(i);

          return;
        }
      }
    }
  };

  // Update the holeListChildrenWidths here when currentGame holeList array changes - it's for caching purposes
  useEffect(() => {
    holeListChildrenWidths.current = null;
  }, [currentGame.holeList.length]);

  return (
    <>
      <div className={styles["running-game--game-info"]}>
        <div
          className={styles["running-game--game-name-container"]}
          onClick={() => setGameMoreInfoOpen((prevValue) => !prevValue)}
        >
          <h2>{props.currentGame.name}</h2>
          <span className={`material-symbol--container material-symbols-outlined`.trim()}>
            keyboard_arrow_down
          </span>
        </div>
        <div className={styles["running-game--game-info-container"]}>
          {gameMoreInfoOpen &&
            <>
              <GameInfo currentGamePlayers={props.currentGame.players} />
              <div className={styles["running-game--game-info-settings"]}>
                <div
                  className={styles["new-game-form--title-symbol--container"]}
                  onClick={() => setConfirmDialog(true)}
                >
                  <span className={`material-symbol--container material-symbols-outlined`.trim()}>
                    settings
                  </span>
                </div>
              </div>
            </>}
        </div>

      </div>
      <div>
        <div>
          <button onClick={handleScrollPreviousHole}>previous</button>
          <select
            onChange={handleHoleOptionSelect}
            value={currentHoleIndex + 1}
          >
            {currentGame.holeList.map((h) => (
              <option key={h.id}>{h.hole}</option>
            ))}
          </select>
          <button onClick={handleScrollNextHole}>next</button>
        </div>
        <ul
          className={styles["running-game--hole-list"]}
          ref={holeListRef}
          onScrollEnd={handleULOnScrollEnd}
        >
          {props.currentGame.holeList.map((hole) => (
            <GameHole
              key={hole.id}
              {...hole}
              handleHolePlayerScore={handleHolePlayerScore}
              handleFinishHole={handleFinishHole}
            />
          ))}
        </ul>
      </div>
      <Dialog isOpen={confirmDialog} closeModal={() => setConfirmDialog(false)}>
        <button onClick={() => setConfirmDialog(false)}>no</button>
        <button onClick={handleFinishGame}>yes</button>
      </Dialog>
    </>
  );
};

const CurrentGame = () => {
  const { gameState, isLoading, setGameState } = useGameState();

  console.log(gameState);

  if (isLoading) {
    return (
      <div className={styles["current-game--loading-container"]}>
        <ProgressActivity className="loading-icon" />
      </div>
    );
  }

  if (!gameState?.currentGame) {
    return (
      <NewGame />
    );
  }

  return (
    <RunningGame currentGame={gameState.currentGame} setGameState={setGameState} />
  );
};

export default CurrentGame;