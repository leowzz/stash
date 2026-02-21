import React from "react";
import * as GQL from "src/core/generated-graphql";
import { FilteredSceneList } from "src/components/Scenes/SceneList";
import { useTagFilterHook } from "src/core/tags";
import { View } from "src/components/List/views";
import { useTagUpdate } from "src/core/StashService";
import { useToast } from "src/hooks/Toast";
import { useIntl } from "react-intl";
import ImageUtils from "src/utils/image";

interface ITagScenesPanel {
  active: boolean;
  tag: GQL.TagDataFragment;
  showSubTagContent?: boolean;
}

export const TagScenesPanel: React.FC<ITagScenesPanel> = ({
  active,
  tag,
  showSubTagContent,
}) => {
  const intl = useIntl();
  const Toast = useToast();
  const [updateTag] = useTagUpdate();
  const filterHook = useTagFilterHook(tag, showSubTagContent);

  function extraOperations(selectedScenes: GQL.SlimSceneDataFragment[]) {
    return [
      {
        text: intl.formatMessage({ id: "actions.set_cover" }),
        onClick: async () => {
          if (!tag.id || selectedScenes.length !== 1) {
            return;
          }

          const imageURL = selectedScenes[0].paths.screenshot;
          if (!imageURL) {
            return;
          }

          try {
            const coverImage = await ImageUtils.imageToDataURL(imageURL);
            await updateTag({
              variables: {
                input: {
                  id: tag.id,
                  image: coverImage,
                },
              },
            });
            Toast.success(
              intl.formatMessage(
                { id: "toast.updated_entity" },
                {
                  entity: intl.formatMessage({ id: "tag" }).toLocaleLowerCase(),
                }
              )
            );
          } catch (e) {
            Toast.error(e);
          }
        },
        isDisplayed: () => selectedScenes.length === 1,
      },
    ];
  }

  return (
    <FilteredSceneList
      filterHook={filterHook}
      alterQuery={active}
      view={View.TagScenes}
      extraOperations={extraOperations}
    />
  );
};
