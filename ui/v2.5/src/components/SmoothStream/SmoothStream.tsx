import React, { useCallback, useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { FormattedMessage, useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import * as GQL from "src/core/generated-graphql";
import { queryFindScenes } from "src/core/StashService";
import { ErrorMessage } from "src/components/Shared/ErrorMessage";
import { LoadingIndicator } from "src/components/Shared/LoadingIndicator";
import { useSmoothStreamContext } from "src/hooks/SmoothStream/context";
import { ListFilterModel } from "src/models/list-filter/filter";
import { SceneQueue } from "src/models/sceneQueue";
import { useTitleProps } from "src/hooks/title";

export const SmoothStream: React.FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const titleProps = useTitleProps({ id: "actions.smooth" });
  const {
    mode,
    randomEnabled,
    enterMode,
    exitMode,
    setMode,
    setRandomEnabled,
  } = useSmoothStreamContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const playRandomScene = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const filter = new ListFilterModel(GQL.FilterMode.Scenes);
      filter.itemsPerPage = 1;
      filter.currentPage = 1;
      filter.sortBy = "random";

      const queryResult = await queryFindScenes(filter);
      const { scenes } = queryResult.data.findScenes;
      const [firstScene] = scenes;

      if (!firstScene) {
        setError(intl.formatMessage({ id: "empty_server" }));
        return;
      }

      const queue = SceneQueue.fromListFilterModel(filter);
      history.replace(
        queue.makeLink(firstScene.id, {
          autoPlay: true,
          continue: true,
          sceneIndex: 0,
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [history, intl]);

  useEffect(() => {
    enterMode();
    playRandomScene();
  }, [enterMode, playRandomScene]);

  return (
    <div className="mt-5 container">
      <Helmet {...titleProps} />
      <h2>
        <FormattedMessage id="actions.smooth" />
      </h2>

      <div className="my-3">
        <Form.Check
          type="radio"
          name="smooth-mode"
          className="mb-2"
          checked={mode === "video"}
          onChange={() => setMode("video")}
          label={intl.formatMessage({ id: "smooth.mode.video" })}
        />
        <Form.Check
          type="radio"
          name="smooth-mode"
          className="mb-2"
          checked={mode === "marker"}
          onChange={() => setMode("marker")}
          label={intl.formatMessage({ id: "smooth.mode.marker" })}
        />
        <Form.Check
          type="switch"
          className="mb-3"
          checked={randomEnabled}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setRandomEnabled(event.currentTarget.checked)
          }
          label={intl.formatMessage({ id: "smooth.random" })}
        />
      </div>

      <div className="d-flex">
        <Button className="mr-2" onClick={() => playRandomScene()}>
          <FormattedMessage id="smooth.random_play" />
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            exitMode();
            history.push("/scenes");
          }}
        >
          <FormattedMessage id="smooth.disable" />
        </Button>
      </div>

      {loading && <LoadingIndicator />}
      {error && <ErrorMessage error={error} />}
    </div>
  );
};

export default SmoothStream;
