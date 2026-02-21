import React from "react";
import * as GQL from "src/core/generated-graphql";
import { useTagFilterHook } from "src/core/tags";
import { ImageList } from "src/components/Images/ImageList";
import { View } from "src/components/List/views";
import { useTagUpdate } from "src/core/StashService";
import { useToast } from "src/hooks/Toast";
import { useIntl } from "react-intl";
import ImageUtils from "src/utils/image";
import { showWhenSingleSelection } from "src/components/List/ItemList";
import { ListFilterModel } from "src/models/list-filter/filter";

interface ITagImagesPanel {
  active: boolean;
  tag: GQL.TagDataFragment;
  showSubTagContent?: boolean;
}

export const TagImagesPanel: React.FC<ITagImagesPanel> = ({
  active,
  tag,
  showSubTagContent,
}) => {
  const intl = useIntl();
  const Toast = useToast();
  const [updateTag] = useTagUpdate();
  const filterHook = useTagFilterHook(tag, showSubTagContent);

  async function setCover(
    result: GQL.FindImagesQueryResult,
    _filter: ListFilterModel,
    selectedIds: Set<string>
  ) {
    const selectedImageID = selectedIds.values().next();
    if (!tag.id || selectedImageID.done) {
      return;
    }

    const selectedImage = result.data?.findImages?.images.find(
      (image) => image.id === selectedImageID.value
    );
    const imageURL = selectedImage?.paths.image;
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
          { entity: intl.formatMessage({ id: "tag" }).toLocaleLowerCase() }
        )
      );
    } catch (e) {
      Toast.error(e);
    }
  }

  const otherOperations = [
    {
      text: intl.formatMessage({ id: "actions.set_cover" }),
      onClick: setCover,
      isDisplayed: showWhenSingleSelection,
    },
  ];

  return (
    <ImageList
      filterHook={filterHook}
      alterQuery={active}
      extraOperations={otherOperations}
      view={View.TagImages}
    />
  );
};
